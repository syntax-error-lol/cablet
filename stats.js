const values = {
    tokens: "0",
    blooks: "0",
    opened: "0",
    exp: "0",
    perms: "Guest"
};

for (const [id, value] of Object.entries(values)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
