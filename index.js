/*
 * index.js
 *
 * This code runs in index.html. It sets up the Login Manager and View Registry for the Tree.
 * There's not much code here, and it was included directly in index.html. However for integration into the
 * WikiTree.com website, it was separated out.
 *
 * New Views are added here, in the View Registry below.
 *
 */

var wtViewRegistry;
window.addEventListener("DOMContentLoaded", async (event) => {

    // ✅ Added: Manual authcode login for GitHub Pages
    const url = new URL(window.location.href);
    const authcode = url.searchParams.get("authcode");

    if (authcode) {
        const formData = new FormData();
        formData.append("action", "clientLogin");
        formData.append("authcode", authcode);
        formData.append("appId", "TA-wt-dynamic-tree");

        try {
            const response = await fetch("https://api.wikitree.com/api.php", {
                method: "POST",
                credentials: "include",
                body: new URLSearchParams(formData),
            });

            const result = await response.json();

            if (result[0]?.status === 0) {
                localStorage.setItem("wikitreeUser", JSON.stringify(result[0].user));
                // Clean up URL
                url.searchParams.delete("authcode");
                const newUrl = url.origin + url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
                window.history.replaceState({}, document.title, newUrl);
            } else {
                console.error("GitHub authcode login failed", result);
            }
        } catch (e) {
            console.error("GitHub authcode login exception:", e);
        }
    }

    const loginManager = new LoginManager(
        WikiTreeAPI,
        (events = {
            onLoggedIn: (user) => {
                document.querySelector(
                    "#wt-api-login"
                ).innerHTML = `Logged into Apps: ${user.name} (<a class="apiLogout" href="#">Logout</a>)`;
            },
            onUnlogged: () => {
                document.querySelector("#wt-api-login").innerHTML = `
          <form id="appsLoginForm" action="https://api.wikitree.com/api.php" method="POST">
              <input type="hidden" name="action" value="clientLogin">
              <input type="hidden" id="returnURL" name="returnURL" value="${window.location.href}">
              <input type="submit" class="small" value="Apps Login"
                title="Please login to the WikiTree Apps to use the Tree Viewer on non-public profiles.">
          </form>
          `;

                if (typeof requireAppsLogin != "undefined" && requireAppsLogin) {
                    $("#appsLoginForm").submit();
                }
            },
        })
    );
    
    // ✅ Manually trigger login state if stored
    const stored = localStorage.getItem("wikitreeUser");
    if (stored) {
        const user = JSON.parse(stored);
        if (typeof loginManager.onLoggedIn === "function") {
            loginManager.onLoggedIn(user);
        } else if (loginManager._events?.onLoggedIn) {
            loginManager._events.onLoggedIn(user);
        }
    }


    $("body").on("click", ".apiLogout", function (e) {
        e.preventDefault();
        loginManager.logout();
    });

    // To add a new View, add a unique keyword with a value of the new View().
    // The default view is the first one (but this is only used if the user has
    // not used the page before, since the last view used is saved in a cookie
    // and used the next time the user goes to this page).
    // Note: the keyword is used as part of the URL to get to the app.
    const views = {
        "wt-dynamic-tree": new WikiTreeDynamicTreeViewer(),
        "fanchart": new FanChartView(),
        "couples": new CouplesTreeView(),
        "cctree": new CCTView(),
        "timeline": new TimelineView(),
        "fandoku": new FandokuView(),
        "fractal": new FractalView(),
        "ahnentafel": new AhnentafelView(),
        "surnames": new SurnamesView(),
        "webs": new WebsView(),
        "familygroup": new FamilyView(),
        "printer-friendly": new PrinterFriendlyView(WikiTreeAPI, 5),
        "calendar": new CalendarView(),
        "portraits": new PortraitView(),
        "nameTest": new NameTestView(),
        "cc7": new CC7View(),
        "ale": new ALEView(),
        "descendants": new DescendantsView(),
        "xtree": new XTreeView(),
        "familyGroupApp": new FamilyGroupAppView(),
        "superbig": new SuperBigFamView(),
        "slippyTree": new SlippyTree(),
        "stats": new StatsView(),
        "wtPlusMaps": new WtPlusMaps(),
        "oneNameTrees": new OneNameTrees(),
        "ancestorsCemeteries": new AncestorsCemeteriesView(),
        "heritage": new HeritageView(),
    };

    for (let key in views) {
        let meta = views[key]?.meta();
        if (meta?.disabled) {
            delete views[key];
        }
    }

    wtViewRegistry = new ViewRegistry(views, new SessionManager(WikiTreeAPI, loginManager));
    wtViewRegistry.render();
});

//// "superbig": new SuperBigFamView(),
