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
        (ticket.status === "open" || ticket.status === "testing") &&
        ticket.status !== "done"
    );

    const done = tickets.filter(ticket => ticket.status === "done");

    return { active, done };
};

// 6. Release decision
const rule6 = () => {
    const releaseBlockers = [...rule1(), ...rule2()];

    if (releaseBlockers.   length > 0) {
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
