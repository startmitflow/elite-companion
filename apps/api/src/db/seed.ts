import { pool } from '../index.js';

const MATERIALS = {
  raw: [
    // Grade 1
    { name: 'Carbon', rarity: 1 },
    { name: 'Iron', rarity: 1 },
    { name: 'Nickel', rarity: 1 },
    { name: 'Phosphorus', rarity: 1 },
    { name: 'Sulphur', rarity: 1 },
    // Grade 2
    { name: 'Chromium', rarity: 2 },
    { name: 'Germanium', rarity: 2 },
    { name: 'Manganese', rarity: 2 },
    { name: 'Vanadium', rarity: 2 },
    { name: 'Zinc', rarity: 2 },
    // Grade 3
    { name: 'Arsenic', rarity: 3 },
    { name: 'Cadmium', rarity: 3 },
    { name: 'Mercury', rarity: 3 },
    { name: 'Molybdenum', rarity: 3 },
    { name: 'Niobium', rarity: 3 },
    { name: 'Tin', rarity: 3 },
    { name: 'Tungsten', rarity: 3 },
    // Grade 4
    { name: 'Antimony', rarity: 4 },
    { name: 'Polonium', rarity: 4 },
    { name: 'Ruthenium', rarity: 4 },
    { name: 'Technetium', rarity: 4 },
    { name: 'Tellurium', rarity: 4 },
    { name: 'Yttrium', rarity: 4 },
    // Grade 5
    { name: 'Abnormal Compact Commissions Data', rarity: 5 },
  ],
  manufactured: [
    // Grade 1
    { name: 'Basic Conductors', rarity: 1 },
    { name: 'Chemical Storage Units', rarity: 1 },
    { name: 'Compact Composites', rarity: 1 },
    { name: 'Heat Conduits', rarity: 1 },
    { name: 'Hybrid Capacitors', rarity: 1 },
    { name: 'Mechanical Components', rarity: 1 },
    { name: 'Micro Controllers', rarity: 1 },
    { name: 'Power Converters', rarity: 1 },
    { name: 'Unknown Carapaces', rarity: 1 },
    { name: 'Worn Shield Emitters', rarity: 1 },
    // Grade 2
    { name: 'Chemical Processors', rarity: 2 },
    { name: 'Conductive Components', rarity: 2 },
    { name: 'Grid Resistors', rarity: 2 },
    { name: 'Heat Exchangers', rarity: 2 },
    { name: 'Mechanical Equipment', rarity: 2 },
    { name: 'Pharmaceutical Isolators', rarity: 2 },
    { name: 'Polymer Capacitors', rarity: 2 },
    { name: 'Shield Emitters', rarity: 2 },
    { name: 'Unknown Fragments', rarity: 2 },
    // Grade 3
    { name: 'Conductive Ceramics', rarity: 3 },
    { name: 'Conductive Polymers', rarity: 3 },
    { name: 'Electrochemical Arrays', rarity: 3 },
    { name: 'Focus Crystals', rarity: 3 },
    { name: 'Heat Vanes', rarity: 3 },
    { name: 'High Density Composites', rarity: 3 },
    { name: 'Mechanical Scrap', rarity: 3 },
    { name: 'Phase Alloys', rarity: 3 },
    { name: 'Propellant Tanks', rarity: 3 },
    { name: 'Shielding Sensors', rarity: 3 },
    { name: 'Unknown Technology', rarity: 3 },
    // Grade 4
    { name: 'Compound Shielding', rarity: 4 },
    { name: 'Conductive Components', rarity: 4 },
    { name: 'Configurable Components', rarity: 4 },
    { name: 'Feed Resonators', rarity: 4 },
    { name: 'Flawed Focus Crystals', rarity: 4 },
    { name: 'Heat Resistant Ceramics', rarity: 4 },
    { name: 'Imperial Shielding', rarity: 4 },
    { name: 'Mechanical Parts', rarity: 4 },
    { name: 'Refined Focus Crystals', rarity: 4 },
    { name: 'Thermic Alloys', rarity: 4 },
    { name: 'Unknown Core Chips', rarity: 4 },
    // Grade 5
    { name: 'Biotech Conductors', rarity: 5 },
    { name: 'Core Dynamics Composites', rarity: 5 },
    { name: 'Filament Composites', rarity: 5 },
    { name: 'Imperial Shielding', rarity: 5 },
    { name: 'Improvised Components', rarity: 5 },
    { name: 'Military Grade Alloys', rarity: 5 },
    { name: 'Military Supercapacitors', rarity: 5 },
    { name: 'Pharmaceutical Isolators', rarity: 5 },
    { name: 'Proto Heat Radiators', rarity: 5 },
    { name: 'Thermic Alloys', rarity: 5 },
  ],
  encoded: [
    // Grade 1
    { name: 'Abnormal Compact Commissions Data', rarity: 1 },
    { name: 'Anomalous Bulk Scan Data', rarity: 1 },
    { name: 'Archer\'s Log', rarity: 1 },
    { name: 'Atypical Disrupted Echoes', rarity: 1 },
    { name: 'Atypical Encryption Codes', rarity: 1 },
    { name: 'Cracked Industrial Firmware', rarity: 1 },
    { name: 'Distorted Shield Cycle Recordings', rarity: 1 },
    { name: 'Inconsistent Shield Data', rarity: 1 },
    { name: 'Irregular Emission Data', rarity: 1 },
    { name: 'Pattern Alpha Obfuscated Data', rarity: 1 },
    { name: 'Pattern Beta Obfuscated Data', rarity: 1 },
    { name: 'Pattern Gamma Obfuscated Data', rarity: 1 },
    { name: 'Specialized Legacy Firmware', rarity: 1 },
    { name: 'Unexpected Emission Data', rarity: 1 },
    { name: 'Untypical Shield Scrambler', rarity: 1 },
    // Grade 2
    { name: 'Abnormal Correlated Emission Data', rarity: 2 },
    { name: 'Archived Emission Data', rarity: 2 },
    { name: 'Compact Emission Data', rarity: 2 },
    { name: 'Cracked Industrial Firmware', rarity: 2 },
    { name: 'Diverted Emission Data', rarity: 2 },
    { name: 'Exceptional Scrambled Emission Data', rarity: 2 },
    { name: 'Inconsistent Shield Data', rarity: 2 },
    { name: 'Irregular Emission Data', rarity: 2 },
    { name: 'Pattern Delta Obfuscated Data', rarity: 2 },
    { name: 'Unexpected Emission Data', rarity: 2 },
    // Grade 3
    { name: 'Adaptive Encryptors', rarity: 3 },
    { name: 'Classified Scan Databanks', rarity: 3 },
    { name: 'Cracked Industrial Firmware', rarity: 3 },
    { name: 'Datamined Wake Exceptions', rarity: 3 },
    { name: 'Decoded Emission Data', rarity: 3 },
    { name: 'Diversified Emission Data', rarity: 3 },
    { name: 'Exceptional Scrambled Emission Data', rarity: 3 },
    { name: 'Inconsistent Shield Data', rarity: 3 },
    { name: 'Pattern Epsilon Obfuscated Data', rarity: 3 },
    { name: 'Unexpected Emission Data', rarity: 3 },
    // Grade 4
    { name: 'Abnormal Compact Commissions Data', rarity: 4 },
    { name: 'Abnormal Correlated Emission Data', rarity: 4 },
    { name: 'Classified Scan Fragment', rarity: 4 },
    { name: 'Datamined Wake Exceptions', rarity: 4 },
    { name: 'Decoded Emission Data', rarity: 4 },
    { name: 'Diversified Emission Data', rarity: 4 },
    { name: 'Exceptional Scrambled Emission Data', rarity: 4 },
    { name: 'Inconsistent Shield Data', rarity: 4 },
    { name: 'Pattern Epsilon Obfuscated Data', rarity: 4 },
    { name: 'Unexpected Emission Data', rarity: 4 },
    // Grade 5
    { name: 'Abnormal Compact Commissions Data', rarity: 5 },
    { name: 'Abnormal Correlated Emission Data', rarity: 5 },
    { name: 'Classified Scan Fragment', rarity: 5 },
    { name: 'Datamined Wake Exceptions', rarity: 5 },
    { name: 'Decoded Emission Data', rarity: 5 },
    { name: 'Diversified Emission Data', rarity: 5 },
    { name: 'Exceptional Scrambled Emission Data', rarity: 5 },
    { name: 'Inconsistent Shield Data', rarity: 5 },
    { name: 'Pattern Epsilon Obfuscated Data', rarity: 5 },
    { name: 'Unexpected Emission Data', rarity: 5 },
    { name: 'Peculiar Shield Frequency Data', rarity: 5 },
    { name: 'Tagged Encryption Codes', rarity: 5 },
    { name: 'Untypical Shield Scrambler', rarity: 5 },
  ],
};

async function seed() {
  console.log('Seeding database with materials...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Seed materials
    for (const [category, materials] of Object.entries(MATERIALS)) {
      for (const mat of materials) {
        await client.query(
          'INSERT INTO materials (name, category, rarity) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [mat.name, category, mat.rarity]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Materials seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
  }

  await pool.end();
  process.exit(0);
}

seed();