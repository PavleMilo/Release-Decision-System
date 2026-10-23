"use strict";
const defaultTickets = [
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
const storageKey = "releaseDecisionTickets";
function isTicket(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const ticket = value;
    return typeof ticket.id === "number" && Number.isInteger(ticket.id) &&
        typeof ticket.title === "string" &&
        typeof ticket.severity === "number" && Number.isInteger(ticket.severity) &&
        ticket.severity >= 1 && ticket.severity <= 5 &&
        (ticket.status === "open" || ticket.status === "testing" || ticket.status === "done") &&
        (typeof ticket.owner === "string" || ticket.owner === null) &&
        typeof ticket.remainingHours === "number" &&
        Number.isFinite(ticket.remainingHours) && ticket.remainingHours >= 0 &&
        typeof ticket.customerVip === "boolean" &&
        typeof ticket.blocked === "boolean";
}
function loadTickets() {
    const savedTickets = localStorage.getItem(storageKey);
    if (savedTickets === null) {
        return defaultTickets.map(ticket => (Object.assign({}, ticket)));
    }
    const parsedTickets = JSON.parse(savedTickets);
    if (!Array.isArray(parsedTickets) || !parsedTickets.every(isTicket)) {
        throw new Error("Sparade ticket-data i localStorage har ett ogiltigt format.");
    }
    const ids = parsedTickets.map(ticket => ticket.id);
    if (new Set(ids).size !== ids.length) {
        throw new Error("Sparade ticket-data i localStorage innehåller dubbla ID:n.");
    }
    return parsedTickets;
}
const tickets = loadTickets();
/* Regler
1. A blocked ticket with severity >= 4 is RELEASE_BLOCKER.
2. An open severity-5 ticket is also RELEASE_BLOCKER, even if blocked is false.
3. A VIP ticket with severity >= 3 that is not done is PRIORITY.
4. Any unassigned ticket (owner is null) that is not done is UNASSIGNED.
5. Other open/testing tickets are ACTIVE. Done tickets are DONE.
6. Release decision: do not release if any ticket is blocked or total active remaining hours exceed 35.
*/
function betterSeverity(severity) {
    if (severity <= 2) {
        return "Low";
    }
    else if (severity === 3) {
        return "Middle";
    }
    else {
        return "High";
    }
}
function betterStatus(status) {
    if (status === "open") {
        return "Open";
    }
    else if (status === "testing") {
        return "Testing";
    }
    else {
        return "Done";
    }
}
function betterBlocked(blocked) {
    return blocked ? "Yes" : "No";
}
function betterVip(customerVip) {
    return customerVip ? "Yes" : "No";
}
function OwnerNull(owner) {
    if (owner === null) {
        return "Ingen ägare";
    }
    return owner;
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        };
        return entities[character];
    });
}
function getReleaseDecision(list) {
    const hasBlockedTickets = list.some(ticket => ticket.blocked);
    const totalActiveHours = list
        .filter(ticket => ticket.status === "open" || ticket.status === "testing")
        .reduce((sum, ticket) => sum + ticket.remainingHours, 0);
    return hasBlockedTickets || totalActiveHours > 35 ? "DO no release" : "Release";
}
function antal(list) {
    const container = document.getElementById("child-release-analysis");
    if (container === null) {
        return;
    }
    const decision = document.getElementById("release-decision");
    if (decision === null) {
        throw new Error('Elementet "#release-decision" hittades inte i dokumentet.');
    }
    const releaseDecision = getReleaseDecision(tickets);
    decision.textContent = `Release analysis: ${releaseDecision}`;
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
function sök() {
    const container = document.getElementById("child-sökväg");
    if (container === null) {
        return;
    }
    const sökOrd = container.value.toLowerCase();
    const filtered = tickets.filter(ticket => ticket.title.toLowerCase().includes(sökOrd) ||
        (ticket.owner && ticket.owner.toLowerCase().includes(sökOrd)) ||
        ticket.severity.toString().includes(sökOrd) ||
        ticket.customerVip.toString().includes(sökOrd) ||
        ticket.status.toLowerCase().includes(sökOrd) ||
        betterStatus(ticket.status).toLowerCase().includes(sökOrd) ||
        betterBlocked(ticket.blocked).toLowerCase().includes(sökOrd) ||
        betterVip(ticket.customerVip).toLowerCase().includes(sökOrd) ||
        LowMidHigh(ticket.severity).toLowerCase().includes(sökOrd) ||
        (ticket.owner === null && "ingen ägare".includes(sökOrd)));
    renderTasks(filtered);
}
function renderTasks(list) {
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
                <h1>${escapeHtml(task.title)}</h1>
                <h2>Owner: ${escapeHtml(OwnerNull(task.owner))}</h2>
            </div>
            <div id="LowerHalf">
                <h3>ID: ${task.id}</h3>
                <h3>Severity: ${betterSeverity(task.severity)}</h3>
                <h3>Remaining hours: ${task.remainingHours}</h3>
                <h3>Status: ${betterStatus(task.status)}</h3>
                <h3>Blocked: ${betterBlocked(task.blocked)}</h3>
                <h3>Vip: ${betterVip(task.customerVip)}</h3>

                <button class="ticket-edit" data-ticket-id="${task.id}" type="button">Redigera</button>
            </div>
        </li>
        `;
    }
}
renderTasks(tickets);
function popUp(task, isNew = false) {
    var _a;
    const container = document.getElementById("edit-content");
    if (container === null) {
        throw new Error('Elementet "#edit-content" hittades inte i dokumentet');
    }
    container.innerHTML = `
        <form id="ticket-edit-form" data-ticket-id="${task.id}" data-is-new="${isNew}">
            <div class="popup-id-status">
                <label>ID
                    <input name="id" type="number" value="${task.id}" readonly>
                </label>
                <label>Status
                    <select name="status" required>
                        <option value="open" ${task.status === "open" ? "selected" : ""}>Open</option>
                        <option value="testing" ${task.status === "testing" ? "selected" : ""}>Testing</option>
                        <option value="done" ${task.status === "done" ? "selected" : ""}>Done</option>
                    </select>
                </label>
            </div>
            <div class="popup-title-owner">
                <label>Title
                    <input name="title" type="text" required value="${escapeHtml(task.title)}">
                </label>
                <label>Owner
                    <input name="owner" type="text" value="${escapeHtml((_a = task.owner) !== null && _a !== void 0 ? _a : "")}" placeholder="Ingen ägare">
                </label>
            </div>
            <div class="popup-vip">
                <label>
                    <input name="customerVip" type="checkbox" ${task.customerVip ? "checked" : ""}>
                    Customer VIP
                </label>
            </div>
            <div id="redigera-popup-ner">
                <label>Severity (1-5)
                    <input name="severity" type="number" min="1" max="5" step="1" required value="${task.severity}">
                </label>
                <label>Remaining Hours
                    <input name="remainingHours" type="number" min="0" step="1" required value="${task.remainingHours}">
                </label>
                <label>
                    <input name="blocked" type="checkbox" ${task.blocked ? "checked" : ""}>
                    Blocked
                </label>
            </div>
            <p id="edit-error" class="edit-error" role="alert" hidden></p>
            <div class="ticket-form-actions">
                <button class="ticket-save" type="submit">${isNew ? "Lägg till" : "Spara"}</button>
                ${isNew ? "" : '<button class="ticket-delete" type="button">Radera ticket</button>'}
            </div>
        </form>
    `;
    const form = container.querySelector("#ticket-edit-form");
    if (form === null) {
        throw new Error('Formuläret "#ticket-edit-form" kunde inte skapas.');
    }
    form.addEventListener("submit", saveTicket);
    const deleteButton = form.querySelector(".ticket-delete");
    if (deleteButton !== null) {
        deleteButton.addEventListener("click", deleteTicket);
    }
}
function showEditPopup(task, isNew = false) {
    popUp(task, isNew);
    if (editContainer === null) {
        throw new Error('Elementet "#parent-container-redigera" hittades inte i dokumentet.');
    }
    editContainer.hidden = false;
}
function nextTicketId() {
    return Math.max(100, ...tickets.map(ticket => ticket.id)) + 1;
}
function persistTickets(updatedTickets, errorMessage) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(updatedTickets));
    }
    catch (error) {
        errorMessage.textContent = `Kunde inte spara ändringarna i localStorage: ${error instanceof Error ? error.message : String(error)}`;
        errorMessage.hidden = false;
        return false;
    }
    tickets.splice(0, tickets.length, ...updatedTickets);
    sök();
    return true;
}
function saveTicket(event) {
    var _a, _b;
    if (!(event.currentTarget instanceof HTMLFormElement)) {
        throw new Error("Spara-händelsen saknar ett giltigt formulär.");
    }
    event.preventDefault();
    const form = event.currentTarget;
    const errorMessage = form.querySelector("#edit-error");
    if (errorMessage === null) {
        throw new Error('Elementet "#edit-error" hittades inte i redigeringsformuläret.');
    }
    errorMessage.hidden = true;
    const formData = new FormData(form);
    const originalId = Number(form.dataset.ticketId);
    const isNew = form.dataset.isNew === "true";
    const severity = Number(formData.get("severity"));
    const remainingHours = Number(formData.get("remainingHours"));
    const title = String((_a = formData.get("title")) !== null && _a !== void 0 ? _a : "").trim();
    const owner = String((_b = formData.get("owner")) !== null && _b !== void 0 ? _b : "").trim() || null;
    const status = formData.get("status");
    if (title.length === 0) {
        errorMessage.textContent = "Title får inte vara tom.";
        errorMessage.hidden = false;
        return;
    }
    if (status !== "open" && status !== "testing" && status !== "done") {
        errorMessage.textContent = "Välj en giltig status.";
        errorMessage.hidden = false;
        return;
    }
    if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
        errorMessage.textContent = "Severity måste vara ett heltal mellan 1 och 5.";
        errorMessage.hidden = false;
        return;
    }
    if (!Number.isInteger(remainingHours) || remainingHours < 0) {
        errorMessage.textContent = "Remaining Hours måste vara ett positivt heltal eller 0.";
        errorMessage.hidden = false;
        return;
    }
    const updatedTicket = {
        id: originalId,
        title,
        severity,
        status,
        owner,
        remainingHours,
        customerVip: formData.has("customerVip"),
        blocked: formData.has("blocked")
    };
    if (isNew && tickets.some(ticket => ticket.id === originalId)) {
        errorMessage.textContent = "Det automatiskt tilldelade ID-numret används redan. Stäng formuläret och försök igen.";
        errorMessage.hidden = false;
        return;
    }
    const updatedTickets = isNew
        ? [...tickets, updatedTicket]
        : tickets.map(ticket => ticket.id === originalId ? updatedTicket : ticket);
    if (persistTickets(updatedTickets, errorMessage)) {
        if (editContainer !== null) {
            editContainer.hidden = true;
        }
    }
}
function deleteTicket(event) {
    if (!(event.currentTarget instanceof HTMLButtonElement)) {
        throw new Error("Radera-händelsen saknar en giltig knapp.");
    }
    const form = event.currentTarget.closest("#ticket-edit-form");
    if (form === null) {
        throw new Error('Formuläret "#ticket-edit-form" hittades inte.');
    }
    const errorMessage = form.querySelector("#edit-error");
    if (errorMessage === null) {
        throw new Error('Elementet "#edit-error" hittades inte i redigeringsformuläret.');
    }
    const ticketId = Number(form.dataset.ticketId);
    if (!window.confirm(`Vill du radera ticket ${ticketId}?`)) {
        return;
    }
    const updatedTickets = tickets.filter(ticket => ticket.id !== ticketId);
    if (updatedTickets.length === tickets.length) {
        errorMessage.textContent = `Ticket ${ticketId} kunde inte hittas.`;
        errorMessage.hidden = false;
        return;
    }
    if (persistTickets(updatedTickets, errorMessage) && editContainer !== null) {
        editContainer.hidden = true;
    }
}
const addTicketButton = document.getElementById("add-ticket-button");
if (addTicketButton !== null) {
    addTicketButton.addEventListener("click", function () {
        showEditPopup({
            id: nextTicketId(),
            title: "",
            severity: 1,
            status: "open",
            owner: null,
            remainingHours: 0,
            customerVip: false,
            blocked: false
        }, true);
    });
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
const rule1 = () => tickets.filter(ticket => ticket.blocked === true && ticket.severity >= 4);
// 2. RELEASE_BLOCKER = open + severity 5
const rule2 = () => tickets.filter(ticket => ticket.status === "open" && ticket.severity === 5);
// 3. PRIORITY = VIP + severity >= 3 + not done
const rule3 = () => tickets.filter(ticket => ticket.customerVip === true &&
    ticket.severity >= 3 &&
    ticket.status !== "done");
// 4. UNASSIGNED = owner is null + not done
const rule4 = () => tickets.filter(ticket => ticket.owner === null &&
    ticket.status !== "done");
// 5. ACTIVE = open/testing, DONE = done
const rule5 = () => {
    const active = tickets.filter(ticket => ticket.status === "open" || ticket.status === "testing");
    const done = tickets.filter(ticket => ticket.status === "done");
    return { active, done };
};
// 6. Release decision
const rule6 = () => {
    return getReleaseDecision(tickets);
};
console.log("Rule 1 release blockers:", rule1());
console.log("Rule 2 open severity 5:", rule2());
console.log("Rule 3 priority:", rule3());
console.log("Rule 4 unassigned:", rule4());
console.log("Rule 5 active/done:", rule5());
console.log("Rule 6 release decision:", rule6());
const editContainer = document.getElementById("parent-container-redigera");
const backButton = document.getElementById("back-button");
const ticketHolder = document.getElementById("ticketHolder");
if (ticketHolder !== null) {
    ticketHolder.addEventListener("click", function (event) {
        if (!(event.target instanceof Element)) {
            return;
        }
        const button = event.target.closest(".ticket-edit");
        if (!button) {
            return;
        }
        const ticketId = Number(button.dataset.ticketId);
        const task = tickets.find(ticket => ticket.id === ticketId);
        if (task === undefined) {
            throw new Error(`Ticket med ID ${button.dataset.ticketId} hittades inte`);
        }
        showEditPopup(task);
    });
}
if (backButton !== null) {
    backButton.addEventListener("click", function () {
        if (editContainer !== null) {
            editContainer.hidden = true;
        }
    });
}
