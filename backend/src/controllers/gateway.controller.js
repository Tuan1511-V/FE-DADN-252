const pool = require("../config/db");
const { parseNumber, parseBoolean, normalizeText, normalizeUpper } = require("../utils/parsers");
const { buildAlerts } = require("../utils/thresholds");
const { pushReadingToAdafruit } = require("../services/adafruit.service");
const { isMockMode } = require("../config/runtime");
const mockStore = require("../data/mock-store");

async function getDashboardOverview(req, res) {
  try {
    if (isMockMode) {
      return res.json({
        success: true,
        data: mockStore.getDashboardOverview()
      });
    }

    return res.json({
      success: true,
      data: {
        environment: null,
        logs: [],
        sensors: [],
        actuators: [],
        summary: {
          sensorsOnline: 0,
          sensorsIssue: 0,
          actuatorsOnline: 0,
          actuatorsIssue: 0
        },
        alerts: []
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function receiveReading(req, res) {
  if (isMockMode) {
    try {
      const result = mockStore.receiveReading(req.body);

      if (result.error) {
        return res.status(result.status).json({
          success: false,
          message: result.error
        });
      }

      return res.json({
        success: true,
        message: "Reading saved successfully",
        data: result.data
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  const client = await pool.connect();
  let hasTransaction = false;

  try {
    const { device_code, temperature, humidity, light_level, ir_detected } = req.body;
    const deviceCode = normalizeText(device_code);

    if (!deviceCode) {
      return res.status(400).json({
        success: false,
        message: "device_code is required"
      });
    }

    const temp = parseNumber(temperature);
    const hum = parseNumber(humidity);
    const light = parseNumber(light_level);
    const motion = parseBoolean(ir_detected);

    const deviceResult = await client.query(
      `SELECT id, device_code, device_name FROM devices WHERE device_code = $1`,
      [deviceCode]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    const device = deviceResult.rows[0];

    await client.query("BEGIN");
    hasTransaction = true;

    const insertResult = await client.query(
      `INSERT INTO sensor_readings
       (device_id, temperature, humidity, light_level, ir_detected, raw_payload, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, recorded_at`,
      [device.id, temp, hum, light, motion, req.body]
    );

    await client.query(
      `UPDATE devices SET last_seen_at = NOW() WHERE id = $1`,
      [device.id]
    );

    const alerts = buildAlerts({
      temperature: temp,
      humidity: hum,
      lightLevel: light,
      irDetected: motion
    });

    for (const alert of alerts) {
      await client.query(
        `INSERT INTO alerts (device_id, alert_type, severity, message)
         VALUES ($1, $2, $3, $4)`,
        [device.id, alert.alert_type, alert.severity, alert.message]
      );
    }

    await client.query("COMMIT");
    hasTransaction = false;

    try {
      await pushReadingToAdafruit({
        temperature: temp,
        humidity: hum,
        lightLevel: light,
        irDetected: motion
      });
    } catch (error) {
      console.error("Adafruit push failed:", error.message);
    }

    return res.json({
      success: true,
      message: "Reading saved successfully",
      data: insertResult.rows[0]
    });
  } catch (error) {
    if (hasTransaction) {
      await client.query("ROLLBACK");
    }

    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    client.release();
  }
}

async function updateDeviceStatus(req, res) {
  try {
    if (isMockMode) {
      const result = mockStore.updateDeviceStatus(req.body);

      if (result.error) {
        return res.status(result.status).json({
          success: false,
          message: result.error
        });
      }

      return res.json({
        success: true,
        message: "Device status updated successfully",
        data: result.data
      });
    }

    const { device_code, power_status, value_text, value_number } = req.body;
    const deviceCode = normalizeText(device_code);

    if (!deviceCode) {
      return res.status(400).json({
        success: false,
        message: "device_code is required"
      });
    }

    const deviceResult = await pool.query(
      `SELECT id FROM devices WHERE device_code = $1`,
      [deviceCode]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    const deviceId = deviceResult.rows[0].id;

    await pool.query(
      `INSERT INTO device_states (device_id, power_status, value_text, value_number, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (device_id)
       DO UPDATE SET
         power_status = EXCLUDED.power_status,
         value_text = EXCLUDED.value_text,
         value_number = EXCLUDED.value_number,
         updated_at = NOW()`,
      [
        deviceId,
        normalizeUpper(power_status, "UNKNOWN"),
        normalizeText(value_text),
        parseNumber(value_number)
      ]
    );

    await pool.query(
      `UPDATE devices SET last_seen_at = NOW() WHERE id = $1`,
      [deviceId]
    );

    return res.json({
      success: true,
      message: "Device status updated successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

async function updateCommandResult(req, res) {
  try {
    if (isMockMode) {
      const result = mockStore.updateCommandResult(req.body);

      if (result.error) {
        return res.status(result.status).json({
          success: false,
          message: result.error
        });
      }

      return res.json({
        success: true,
        message: "Command updated successfully",
        data: result.data
      });
    }

    const { command_id, status, error_message } = req.body;

    const result = await pool.query(
      `UPDATE device_commands
       SET status = $1,
           error_message = $2,
           executed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [normalizeUpper(status), normalizeText(error_message), Number(command_id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Command not found"
      });
    }

    return res.json({
      success: true,
      message: "Command updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {
  getDashboardOverview,
  receiveReading,
  updateDeviceStatus,
  updateCommandResult
};
