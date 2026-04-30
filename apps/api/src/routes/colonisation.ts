import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';

const pool = getPool();

const router = Router();

// Auth middleware
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all colonisation projects
router.get('/projects', authenticate, async (req: any, res) => {
  const { status } = req.query;

  try {
    let query = 'SELECT * FROM colonisation_projects WHERE user_id = $1';
    const params: any[] = [req.userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/projects/:id', authenticate, async (req: any, res) => {
  try {
    const projectResult = await pool.query(
      'SELECT * FROM colonisation_projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const requirementsResult = await pool.query(
      'SELECT * FROM construction_requirements WHERE project_id = $1',
      [req.params.id]
    );

    res.json({
      ...projectResult.rows[0],
      requirements: requirementsResult.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new colonisation project
router.post('/projects', authenticate, async (req: any, res) => {
  const { systemName, projectType, economyType, notes } = req.body;

  const validProjectTypes = ['outpost', 'hub', 'station', 'megaship'];
  const validEconomyTypes = ['industrial', 'refinery', 'agriculture', 'military', 'tourism', 'hightech', 'extraction'];

  if (!systemName || !projectType || !economyType) {
    return res.status(400).json({ error: 'systemName, projectType, and economyType are required' });
  }

  if (!validProjectTypes.includes(projectType)) {
    return res.status(400).json({ error: 'Invalid project type' });
  }

  if (!validEconomyTypes.includes(economyType)) {
    return res.status(400).json({ error: 'Invalid economy type' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO colonisation_projects (user_id, system_name, project_type, economy_type, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, systemName, projectType, economyType, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/projects/:id', authenticate, async (req: any, res) => {
  const { status, progressPercent, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE colonisation_projects SET
        status = COALESCE($1, status),
        progress_percent = COALESCE($2, progress_percent),
        notes = COALESCE($3, notes),
        updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *`,
      [status, progressPercent, notes, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/projects/:id', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM colonisation_projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Analyze system resources from scan data
router.post('/analyze', authenticate, async (req: any, res) => {
  const { systemName, bodies } = req.body;

  if (!systemName || !Array.isArray(bodies)) {
    return res.status(400).json({ error: 'systemName and bodies array required' });
  }

  const recommendations: { bodyName: string; recommendedEconomy: string; reason: string }[] = [];

  for (const body of bodies) {
    let recommendedEconomy = 'extraction'; // Default
    let reason = 'Default recommendation';

    // Analyze based on body type and resources
    if (body.terraformState === 'Terraformed' || body.terraformState === 'Terraformable') {
      recommendedEconomy = 'agriculture';
      reason = 'Terraformed or terraformable world suitable for agriculture';
    } else if (body.resources?.some((r: any) => ['Iron', 'Nickel', 'Manganese', 'Arsenic'].includes(r.name))) {
      recommendedEconomy = 'industrial';
      reason = 'Rich mineral deposits suitable for industrial economy';
    } else if (body.bodyType === 'AsteroidCluster' || body.hasRings) {
      recommendedEconomy = 'extraction';
      reason = 'Asteroid cluster or ring system ideal for extraction';
    } else if (body.atmosphereType === 'None' && body.landable) {
      recommendedEconomy = 'refinery';
      reason = 'Landable airless body suitable for refinery operations';
    }

    recommendations.push({
      bodyName: body.name,
      recommendedEconomy,
      reason,
    });

    // Store analysis
    await pool.query(
      `INSERT INTO system_resources (system_name, body_name, body_type, resources, atmosphere_type, terraform_state, landable, recommended_economy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (system_name, body_name)
       DO UPDATE SET resources = $4, atmosphere_type = $5, terraform_state = $6, landable = $7, recommended_economy = $8, analyzed_at = NOW()`,
      [systemName, body.name, body.bodyType, JSON.stringify(body.resources), body.atmosphereType, body.terraformState, body.landable, recommendedEconomy]
    );
  }

  res.json({ systemName, recommendations });
});

// Get build requirements for project type
router.get('/requirements/:projectType', async (req, res) => {
  const { projectType } = req.params;

  // These would normally come from a database with actual game data
  const requirements: Record<string, { materials: { name: string; amount: number }[] }> = {
    outpost: {
      materials: [
        { name: 'Steel', amount: 500 },
        { name: 'Aluminium', amount: 300 },
        { name: 'Polymer', amount: 200 },
        { name: 'CMM Composite', amount: 100 },
      ],
    },
    hub: {
      materials: [
        { name: 'Steel', amount: 2000 },
        { name: 'Aluminium', amount: 1500 },
        { name: 'Polymer', amount: 1000 },
        { name: 'CMM Composite', amount: 500 },
        { name: 'Power Converter', amount: 200 },
      ],
    },
    station: {
      materials: [
        { name: 'Steel', amount: 10000 },
        { name: 'Aluminium', amount: 8000 },
        { name: 'Polymer', amount: 5000 },
        { name: 'CMM Composite', amount: 3000 },
        { name: 'Power Converter', amount: 1000 },
        { name: 'Superconductor', amount: 500 },
      ],
    },
    megaship: {
      materials: [
        { name: 'Steel', amount: 50000 },
        { name: 'Aluminium', amount: 40000 },
        { name: 'Polymer', amount: 25000 },
        { name: 'CMM Composite', amount: 15000 },
        { name: 'Power Converter', amount: 5000 },
        { name: 'Superconductor', amount: 2000 },
      ],
    },
  };

  const data = requirements[projectType];
  if (!data) {
    return res.status(404).json({ error: 'Unknown project type' });
  }

  res.json(data);
});

// Update construction progress
router.put('/progress/:projectId', authenticate, async (req: any, res) => {
  const { materials } = req.body; // Array of { materialName, delivered }

  if (!Array.isArray(materials)) {
    return res.status(400).json({ error: 'materials array required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const mat of materials) {
      await client.query(
        `INSERT INTO construction_requirements (project_id, material_name, required, delivered)
         VALUES ($1, $2, 0, $3)
         ON CONFLICT (project_id, material_name)
         DO UPDATE SET delivered = $3`,
        [req.params.projectId, mat.materialName, mat.delivered]
      );
    }

    // Calculate progress percentage
    const progressResult = await client.query(
      `SELECT
        COALESCE(SUM(delivered), 0) as total_delivered,
        COALESCE(SUM(required), 0) as total_required
       FROM construction_requirements
       WHERE project_id = $1`,
      [req.params.projectId]
    );

    const { total_delivered, total_required } = progressResult.rows[0];
    const progressPercent = total_required > 0 ? Math.floor((total_delivered / total_required) * 100) : 0;

    await client.query(
      'UPDATE colonisation_projects SET progress_percent = $1, updated_at = NOW() WHERE id = $2',
      [progressPercent, req.params.projectId]
    );

    await client.query('COMMIT');
    res.json({ success: true, progressPercent });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update progress' });
  } finally {
    client.release();
  }
});

// Get economy recommendations for a system
router.get('/economy-recommendations/:systemName', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM system_resources WHERE system_name = $1 ORDER BY body_name',
      [req.params.systemName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System not analyzed yet' });
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

export default router;