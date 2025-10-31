const RECORDS_URL = "https://raw.githubusercontent.com/<your-username>/van-attendance-frontend/main/records.json"; // Updated by Action
const COST_PER_DAY = 50;

async function loadData() {
  const res = await fetch(RECORDS_URL + "?t=" + Date.now());
  return await res.json();
}

function todayKey() {
  return new Date().toISOString().slice(0,10);
}

async function render() {
  const data = await loadData();
  const today = todayKey();
  const list = document.getElementById("todayList");
  const table = document.getElementById("summaryTable");
  list.innerHTML = "";
  table.innerHTML = "";

  const todays = data.attendance.filter(a => a.date === today);
  todays.forEach(a => {
    const li = document.createElement("li");
    li.textContent = a.name;
    list.appendChild(li);
  });

  const counts = {};
  data.attendance.forEach(a => {
    counts[a.name] = (counts[a.name] || 0) + 1;
  });

  Object.entries(counts).forEach(([name, days]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${name}</td><td>${days}</td><td>${days*COST_PER_DAY}</td>`;
    table.appendChild(row);
  });
}

document.getElementById("attendanceForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  if (!name) return;
  const data = await loadData();
  const today = todayKey();

  // validate unique name registration
  if (!data.users.includes(name)) {
    data.users.push(name);
  }

  const already = data.attendance.find(a => a.date === today && a.name === name);
  const msg = document.getElementById("message");

  if (already) {
    msg.textContent = "✅ Already marked today!";
    msg.style.color = "green";
  } else {
    data.attendance.push({ date: today, name });
    msg.textContent = "🎉 Attendance marked!";
    msg.style.color = "blue";

    // push changes to backend repo through workflow trigger (Action updates)
    await fetch(
      "https://api.github.com/repos/<your-username>/van-attendance-data/dispatches",
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "token " + "<GITHUB_TOKEN_PLACEHOLDER>",
        },
        body: JSON.stringify({ event_type: "update_records", client_payload: data }),
      }
    );
  }

  render();
});

render();
