document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const searchResult = document.getElementById("searchResult");

    const targetInput = document.getElementById("targetInput");
    const reasonInput = document.getElementById("reasonInput");
    const userResult = document.getElementById("userResult");
    const actionBtns = document.querySelectorAll(".action-btn");

    const themeInput = document.getElementById("themeInput");
    const themeBtn = document.getElementById("themeBtn");

    const toggles = document.querySelectorAll("[data-guard]");

    const clearLogsBtn = document.getElementById("clearLogsBtn");

    function setResult(el, html) {
        if (!el) return;
        el.innerHTML = html;
    }

    if (searchInput && searchBtn && searchResult) {
        function renderSearch() {
            const v = searchInput.value.trim();

            if (!v) {
                searchResult.textContent = "Arama sonucu burada görünecek.";
                return;
            }

            setResult(
                searchResult,
                `
                <div>
                    <div style="font-weight:700; margin-bottom:8px;">Arama: ${v}</div>
                    <div style="color:#9b9b9b; line-height:1.6;">
                        Bu bölüm sonra bot verisiyle bağlanacak.<br />
                        Kullanıcı bilgisi, warn sayısı ve işlem geçmişi burada gösterilecek.
                    </div>
                </div>
                `
            );
        }

        searchBtn.addEventListener("click", renderSearch);
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") renderSearch();
        });
    }

    if (actionBtns.length && targetInput && reasonInput && userResult) {
        actionBtns.forEach((btn) => {
            btn.addEventListener("click", async () => {
                const action = btn.getAttribute("data-action");
                const target = targetInput.value.trim();
                const reason = reasonInput.value.trim();

                if (!target) {
                    setResult(userResult, "Önce kullanıcı adı veya ID gir.");
                    return;
                }

                const res = await fetch("/api/users/action", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action,
                        target,
                        reason
                    })
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setResult(userResult, data.message || "İşlem başarısız.");
                    return;
                }

                setResult(
                    userResult,
                    `
                    <div>
                        <div style="font-weight:700; margin-bottom:8px;">${data.message}</div>
                        <div style="color:#9b9b9b; line-height:1.6;">
                            Hedef: ${target}<br />
                            Sebep: ${reason || "Belirtilmedi"}
                        </div>
                    </div>
                    `
                );
            });
        });
    }

    if (themeBtn && themeInput) {
        themeBtn.addEventListener("click", async () => {
            const theme = themeInput.value.trim() || "Mercedes Black";

            await fetch("/api/panel/theme", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ theme })
            });

            location.reload();
        });
    }

    if (toggles.length) {
        toggles.forEach((btn) => {
            btn.addEventListener("click", async () => {
                const key = btn.getAttribute("data-guard");

                await fetch("/api/guard/toggle", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ key })
                });

                location.reload();
            });
        });
    }

    if (clearLogsBtn) {
        clearLogsBtn.addEventListener("click", async () => {
            await fetch("/api/logs/clear", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            location.reload();
        });
    }
});
