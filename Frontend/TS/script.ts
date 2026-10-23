const tickets = [
    { id: 101, title: "Login outage", severity: 5, status: "open", owner: "Ava", remainingHours: 6, customerVip: true, blocked: false },
    { id: 102, title: "Export slow", severity: 3, status: "open", owner: "Noah", remainingHours: 4, customerVip: false, blocked: false },
    { id: 103, title: "Payment error", severity: 5, status: "testing", owner: "Ava", remainingHours: 9, customerVip: true, blocked: true },
    { id: 104, title: "Avatar upload", severity: 2, status: "done", owner: "Mira", remainingHours: 3, customerVip: false, blocked: false },
    { id: 105, title: "Search ranking", severity: 3, status: "open", owner: "Noah", remainingHours: 7, customerVip: true, blocked: false },
    { id: 106, title: "Role permissions", severity: 4, status: "testing", owner: "Leo", remainingHours: 8, customerVip: false, blocked: false },
    { id: 107, title: "Email delay", severity: 2, status: "open", owner: null, remainingHours: 2, customerVip: true, blocked: false },
    { id: 108, title: "Backup failure", severity: 5, status: "open", owner: "Mira", remainingHours: 10, customerVip: false, blocked: true },
    { id: 109, title: "Report totals", severity: 3, status: "done", owner: "Leo", remainingHours: 5, customerVip: false, blocked: false },
    { id: 110, title: "Session timeout", severity: 4, status: "open", owner: "Ava", remainingHours: 6, customerVip: false, blocked: false },
    { id: 111, title: "Mobile menu", severity: 1, status: "done", owner: "Noah", remainingHours: 2, customerVip: false, blocked: false },
    { id: 112, title: "Invoice mismatch", severity: 4, status: "testing", owner: null, remainingHours: 7, customerVip: true, blocked: false }
];

/* Regler
1. A blocked ticket with severity >= 4 is RELEASE_BLOCKER.
2. An open severity-5 ticket is also RELEASE_BLOCKER, even if blocked is false.
3. A VIP ticket with severity >= 3 that is not done is PRIORITY.
4. Any unassigned ticket (owner is null) that is not done is UNASSIGNED.
5. Other open/testing tickets are ACTIVE. Done tickets are DONE.
6. Release decision: BLOCK if any RELEASE_BLOCKER exists; otherwise REVIEW if there are any UNASSIGNED tickets or total active work hours > 35; otherwise RELEASE.
*/

function betterSeverity(severity: number) {
    if (severity <= 2) {
        return "Low";
    } else if (severity === 3) {
        return "Middle";
    } else {
        return "High";
    }
}

function betterStatus(status: string) {
    if (status === "open") {
        return "Open";
    } else if (status === "testing") {
        return "Testing";
    } else {
        return "Done";
    }
}

function betterBlocked(blocked: boolean) {
    return blocked ? "Yes" : "No";
}

function betterVip(customerVip: boolean) {
    return customerVip ? "Yes" : "No";
}

function OwnerNull(owner: string | null) {
    if (owner === null) {
        return "Ingen ägare";
    }
    return owner;
}

function antal(list: typeof tickets) {
    const container = document.getElementById("child-release-analysis");
    if (container === null) {
        return;
    }

    let timmar = 0;
    let blocked = 0;
    let vipCustomers = 0;

    for (const ticket of list) {
        if (ticket.status === "open" || ticket.status === "testing") {
            timmar += ticket.remainingHours;
        }
        if (ticket.blocked) {
            blocked++;
        }
        if (ticket.customerVip) {
            vipCustomers++;
        }
    }

    container.innerHTML = `
    <p class="release-analysis">Antal tickets: ${list.length}</p>
    <p class="release-analysis">Aktiva timmar kvar: ${timmar}</p>
    <p class="release-analysis">Antal blockerade: ${blocked}</p>
    <p class="release-analysis">Antal VIP-tickets: ${vipCustomers}</p>
    `;
}

function renderTasks(list: typeof tickets) {
    const container = document.getElementById("ticketHolder");
    if (container === null) {
        throw new Error('Elementet "#ticketHolder" hittades inte i dokumentet.');
    }
    antal(list);
    container.innerHTML = "";
    for (let i = 0; i < list.length; i++) {
        const task = list[i];
        container.innerHTML += `
        <li class="task-list"> 
            <div id="UpperHalf">
                <h1>${task.title}</h1>
                <h2>Owner: ${OwnerNull(task.owner)}</h2>
            </div>
            <div id="LowerHalf">
                <h3>ID: ${task.id}</h3>
                <h3>Severity: ${betterSeverity(task.severity)}</h3>
                <h3>Remaining hours: ${task.remainingHours}</h3>
                <h3>Status: ${betterStatus(task.status)}</h3>
                <h3>Blocked: ${betterBlocked(task.blocked)}</h3>
                <h3>Vip: ${betterVip(task.customerVip)}</h3>
            </div>
        </li>
        `;
    }
}
renderTasks(tickets);

function sök() {
    const container = document.getElementById("child-sökväg") as HTMLInputElement | null;
    if (container === null) {
        return;
    }
    const sökOrd = container.value.trim().toLowerCase();
    const idSökOrd = sökOrd.replace(/^i/, "");

    const numericQuery = /^\d+$/.test(sökOrd);
    const filtered = tickets.filter(ticket => numericQuery
        ? ticket.remainingHours === Number(sökOrd)
        : ticket.title.toLowerCase().includes(sökOrd) ||
        (idSökOrd !== "" && ticket.id.toString().includes(idSökOrd)) ||
        (ticket.owner && ticket.owner.toLowerCase().includes(sökOrd)) ||
        (ticket.customerVip && sökOrd === "vip") ||
        betterStatus(ticket.status).toLowerCase().includes(sökOrd) ||
        betterBlocked(ticket.blocked).toLowerCase().includes(sökOrd) ||
        betterVip(ticket.customerVip).toLowerCase().includes(sökOrd) ||
        betterSeverity(ticket.severity).toLowerCase().includes(sökOrd) ||
        (ticket.owner === null && "ingen ägare".includes(sökOrd))
    );

    renderTasks(filtered);
}

const searchInput = document.getElementById("child-sökväg");
if (searchInput !== null) {
    searchInput.addEventListener("input", sök);
}

const searchForm = document.getElementById("parent-sökväg");
if (searchForm !== null) {
    searchForm.addEventListener("submit", event => event.preventDefault());
}

// 1. RELEASE_BLOCKER = blocked + severity >= 4
const rule1 = () => tickets.filter(ticket =>
    ticket.blocked === true && ticket.severity >= 4
);

// 2. RELEASE_BLOCKER = open + severity 5
const rule2 = () => tickets.filter(ticket =>
    ticket.status === "open" && ticket.severity === 5
);

// 3. PRIORITY = VIP + severity >= 3 + not done
const rule3 = () => tickets.filter(ticket =>
    ticket.customerVip === true &&
    ticket.severity >= 3 &&
    ticket.status !== "done"
);

// 4. UNASSIGNED = owner is null + not done
const rule4 = () => tickets.filter(ticket =>
    ticket.owner === null &&
    ticket.status !== "done"
);

// 5. ACTIVE = open/testing, DONE = done
const rule5 = () => {
    const active = tickets.filter(ticket =>
        ticket.status === "open" || ticket.status === "testing"
    );

    const done = tickets.filter(ticket => ticket.status === "done");

    return { active, done };
};

// 6. Release decision
const rule6 = () => {
    const releaseBlockers = [...rule1(), ...rule2()];

    if (releaseBlockers.length > 0) {
        return "BLOCK";
    }

    const unassigned = rule4();
    const active = tickets.filter(ticket =>
        ticket.status === "open" || ticket.status === "testing"
    );

    const totalActiveHours = active.reduce((sum, ticket) => sum + ticket.remainingHours, 0);

    if (unassigned.length > 0 || totalActiveHours > 35) {
        return "REVIEW";
    }

    return "RELEASE";
};

console.log("Rule 1 release blockers:", rule1());
console.log("Rule 2 open severity 5:", rule2());
console.log("Rule 3 priority:", rule3());
console.log("Rule 4 unassigned:", rule4());
console.log("Rule 5 active/done:", rule5());
console.log("Rule 6 release decision:", rule6());
