const db = require("../config/database");

// Cascading search with filters: Department -> Location -> Facility -> Doctor Name
exports.searchDoctors = async (req, res) => {
  try {
    const {
      specialization,
      location,
      facility_type,
      facility_id,
      doctor_name,
      department,
    } = req.query;

    let query = `
      SELECT DISTINCT
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        d.doctor_code,
        d.consultation_fee,
        ARRAY_AGG(DISTINCT s.spec_name) FILTER (WHERE s.spec_name IS NOT NULL) as specializations,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'facility_id', COALESCE(h.hospital_id, c.chamber_id),
          'facility_name', COALESCE(h.name, c.name),
          'facility_type', CASE WHEN h.hospital_id IS NOT NULL THEN 'hospital' ELSE 'chamber' END,
          'location', COALESCE(h.location, c.location),
          'address', COALESCE(h.address, c.address)
        )) FILTER (WHERE h.hospital_id IS NOT NULL OR c.chamber_id IS NOT NULL) as facilities
      FROM users u
      INNER JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN doctor_specializations ds ON d.user_id = ds.doctor_id
      LEFT JOIN specializations s ON ds.spec_id = s.spec_id
      LEFT JOIN hospital_doctors hd ON d.user_id = hd.doctor_id
      LEFT JOIN hospitals h ON hd.hospital_id = h.hospital_id
      LEFT JOIN chambers c ON d.user_id = c.doctor_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by specialization
    if (specialization) {
      query += ` AND s.spec_name ILIKE $${paramIndex}`;
      params.push(`%${specialization}%`);
      paramIndex++;
    }

    // Filter by location
    if (location) {
      query += ` AND (h.location ILIKE $${paramIndex} OR c.location ILIKE $${paramIndex})`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    // Filter by facility type
    if (facility_type === "hospital") {
      query += ` AND h.hospital_id IS NOT NULL`;
    } else if (facility_type === "chamber") {
      query += ` AND c.chamber_id IS NOT NULL`;
    }

    // Filter by specific facility
    if (facility_id && facility_type === "hospital") {
      query += ` AND h.hospital_id = $${paramIndex}`;
      params.push(facility_id);
      paramIndex++;
    } else if (facility_id && facility_type === "chamber") {
      query += ` AND c.chamber_id = $${paramIndex}`;
      params.push(facility_id);
      paramIndex++;
    }

    // Filter by doctor name
    if (doctor_name) {
      query += ` AND u.full_name ILIKE $${paramIndex}`;
      params.push(`%${doctor_name}%`);
      paramIndex++;
    }

    query += ` GROUP BY u.user_id, d.doctor_code, d.consultation_fee ORDER BY u.full_name`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available locations for filter
exports.getLocations = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT location FROM (
        SELECT location FROM hospitals WHERE location IS NOT NULL
        UNION
        SELECT location FROM chambers WHERE location IS NOT NULL
      ) AS locations
      ORDER BY location
    `);
    res.json(result.rows.map((r) => r.location));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get facilities by location and type
exports.getFacilitiesByLocation = async (req, res) => {
  try {
    const { location, type } = req.query;

    let query = "";
    const params = [];

    if (type === "hospital") {
      query = `SELECT hospital_id as id, name, location, address, 'hospital' as type 
               FROM hospitals WHERE 1=1`;
      if (location) {
        query += ` AND location ILIKE $1`;
        params.push(`%${location}%`);
      }
    } else if (type === "chamber") {
      query = `SELECT chamber_id as id, name, location, address, 'chamber' as type 
               FROM chambers WHERE 1=1`;
      if (location) {
        query += ` AND location ILIKE $1`;
        params.push(`%${location}%`);
      }
    } else {
      query = `
        SELECT hospital_id as id, name, location, address, 'hospital' as type FROM hospitals
        UNION
        SELECT chamber_id as id, name, location, address, 'chamber' as type FROM chambers
      `;
      if (location) {
        query = `SELECT * FROM (${query}) AS facilities WHERE location ILIKE $1`;
        params.push(`%${location}%`);
      }
    }

    query += ` ORDER BY name`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
