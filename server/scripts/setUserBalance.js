const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const db = require("../src/config/database");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--amount" || a === "-a") args.amount = argv[++i];
    else if (a === "--userId" || a === "-u") args.userId = argv[++i];
    else if (a === "--email" || a === "-e") args.email = argv[++i];
    else if (a === "--name" || a === "-n") args.name = argv[++i];
    else if (!args._) args._ = a;
  }
  return args;
}

async function ensureAccount(client, userId) {
  const res = await client.query(
    "SELECT account_id, balance, currency FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
    [userId],
  );
  if (res.rows.length) return res.rows[0];

  const created = await client.query(
    "INSERT INTO accounts (owner_type, owner_id) VALUES ('user', $1) RETURNING account_id, balance, currency",
    [userId],
  );
  return created.rows[0];
}

async function resolveUser(client, { userId, email, name, fallback }) {
  if (userId || (fallback && /^\d+$/.test(fallback))) {
    const id = Number(userId || fallback);
    const u = await client.query(
      "SELECT user_id, full_name, email, role FROM users WHERE user_id = $1",
      [id],
    );
    return u.rows;
  }

  const maybeEmail =
    email || (fallback && String(fallback).includes("@") ? fallback : null);
  if (maybeEmail) {
    const u = await client.query(
      "SELECT user_id, full_name, email, role FROM users WHERE lower(email) = lower($1)",
      [maybeEmail],
    );
    return u.rows;
  }

  const qName = name || fallback;
  if (qName) {
    const u = await client.query(
      "SELECT user_id, full_name, email, role FROM users WHERE full_name ILIKE $1 ORDER BY user_id",
      [`%${qName}%`],
    );
    return u.rows;
  }

  return [];
}

async function main() {
  const args = parseArgs(process.argv);
  const targetAmount = Number(args.amount ?? 400);

  if (!Number.isFinite(targetAmount) || targetAmount < 0) {
    console.error("Invalid --amount. Provide a number >= 0.");
    process.exitCode = 1;
    return;
  }

  const client = await db.connect();
  try {
    const users = await resolveUser(client, {
      userId: args.userId,
      email: args.email,
      name: args.name,
      fallback: args._,
    });

    if (users.length === 0) {
      console.error(
        "User not found. Provide --userId, --email, or --name (or pass one positional value).",
      );
      process.exitCode = 1;
      return;
    }

    if (users.length > 1) {
      console.error(
        "Multiple users matched. Re-run with --userId. Matches:\n" +
          users
            .slice(0, 20)
            .map(
              (u) =>
                `- user_id=${u.user_id} | ${u.full_name || ""} | ${u.email || ""} | role=${u.role}`,
            )
            .join("\n"),
      );
      process.exitCode = 1;
      return;
    }

    const user = users[0];
    if (user.role !== "patient") {
      console.warn(
        `Warning: user_id=${user.user_id} role is '${user.role}', not 'patient'. Continuing anyway.`,
      );
    }

    await client.query("BEGIN");

    const account = await ensureAccount(client, user.user_id);
    const current = Number(account.balance);
    const delta = Number((targetAmount - current).toFixed(2));

    if (Math.abs(delta) < 0.005) {
      await client.query("COMMIT");
      console.log(
        `No change needed. user_id=${user.user_id} balance is already ${account.balance} ${account.currency}.`,
      );
      return;
    }

    const desc = `Test balance set to ${targetAmount} BDT (adjustment)`;

    if (delta > 0) {
      await client.query(
        "INSERT INTO account_transactions (to_account_id, amount, status, description) VALUES ($1, $2, 'completed', $3)",
        [account.account_id, delta, desc],
      );
    } else {
      await client.query(
        "INSERT INTO account_transactions (from_account_id, amount, status, description) VALUES ($1, $2, 'completed', $3)",
        [account.account_id, Math.abs(delta), desc],
      );
    }

    const refreshed = await client.query(
      "SELECT balance, currency FROM accounts WHERE account_id = $1",
      [account.account_id],
    );

    await client.query("COMMIT");

    console.log({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      old_balance: current,
      new_balance: refreshed.rows[0].balance,
      currency: refreshed.rows[0].currency,
    });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error("Failed to set balance:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

main();
