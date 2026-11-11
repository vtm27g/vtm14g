/* VTM14 — activation unique, puis démarrage local sans revalidation réseau.
   Le code n'est jamais conservé après une activation réussie. */
(function () {
  "use strict";

  var API = "https://vtm27-activation-api.vtm27market.workers.dev";
  var DB_NAME = "vtm14-license-db";
  var DB_VERSION = 1;
  var STORE = "license";
  var RECORD_KEY = "vtm14.license.record";
  var LEGACY_CODE_KEY = "vtm14.license.code";
  var DEVICE_KEY = "vtm14.license.device";
  var PROMOS = [
    ["ViralTech Market • Gaming & solutions numériques", "Consoles PS3, PS4 et PS5 • Manettes • Casques • Accessoires"],
    ["Votre partenaire Gaming & Tech", "Vente • Réparation • Accessoires • Assistance"],
    ["Nos solutions digitales", "Sites web • Logiciels de stock • Gestion commerciale"],
    ["Maintenance & visibilité", "Bases de données • Référencement Google • Automatisation"],
    ["ViralTech Market", "Des solutions pensées pour vous simplifier la vie."]
  ];

  var form = document.getElementById("licenseForm");
  var codeInput = document.getElementById("licenseCode");
  var status = document.getElementById("licenseStatus");
  var button = document.getElementById("activateBtn");
  var card = document.getElementById("activationCard");
  var promoTimer = null;
  var launchTimer = null;
  var promoIndex = 0;
  var busy = false;

  function safeGet(key) {
    try { return localStorage.getItem(key) || ""; } catch (_) { return ""; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
  }
  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }
  function makeDeviceId() {
    var id = safeGet(DEVICE_KEY);
    if (/^[a-f0-9]{48}$/.test(id)) return id;
    if (!window.crypto || !crypto.getRandomValues) return "";
    var bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    id = Array.prototype.map.call(bytes, function (b) {
      return ("0" + b.toString(16)).slice(-2);
    }).join("");
    return safeSet(DEVICE_KEY, id) ? id : "";
  }
  var deviceId = makeDeviceId();

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("IndexedDB indisponible"));
      var request;
      try { request = indexedDB.open(DB_NAME, DB_VERSION); }
      catch (e) { reject(e); return; }
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Ouverture IndexedDB impossible")); };
      request.onblocked = function () { reject(new Error("Base locale occupée par un autre onglet")); };
    });
  }
  async function readRecord() {
    var dbRecord = null;
    try {
      var db = await openDb();
      dbRecord = await new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readonly");
        var req = tx.objectStore(STORE).get("active");
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
        tx.oncomplete = function () { db.close(); };
      });
    } catch (_) {}
    if (validRecord(dbRecord)) return dbRecord;

    var raw = safeGet(RECORD_KEY);
    if (raw) {
      try {
        var localRecord = JSON.parse(raw);
        if (validRecord(localRecord)) return localRecord;
      } catch (_) {}
    }
    return null;
  }
  function validRecord(record) {
    return !!record &&
      record.schema === 2 &&
      record.id === "active" &&
      record.activated === true &&
      /^[a-f0-9]{48}$/.test(record.deviceId || "") &&
      typeof record.activatedAt === "number" &&
      record.deviceId === deviceId;
  }
  async function saveRecord(record) {
    var localSaved = safeSet(RECORD_KEY, JSON.stringify(record));
    var dbSaved = false;
    try {
      var db = await openDb();
      await new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(record);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error || new Error("Écriture locale impossible")); };
        tx.onabort = function () { reject(tx.error || new Error("Écriture locale annulée")); };
      });
      dbSaved = true;
      db.close();
    } catch (_) {}
    if (!localSaved && !dbSaved) throw new Error("Le navigateur ne permet pas d'enregistrer la licence. Libérez de l'espace puis réessayez.");
    safeRemove(LEGACY_CODE_KEY);
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(function () {});
      }
    } catch (_) {}
  }
  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.className = kind || "";
  }
  function promo() {
    var title = document.getElementById("promoTitle");
    var text = document.getElementById("promoText");
    if (!title || !text) return;
    var item = PROMOS[promoIndex++ % PROMOS.length];
    title.textContent = item[0];
    text.textContent = item[1];
  }
  function stopTimers() {
    if (promoTimer) clearInterval(promoTimer);
    if (launchTimer) clearInterval(launchTimer);
    promoTimer = launchTimer = null;
  }
  function beginAutomatically(offline) {
    stopTimers();
    if (!card) return;
    card.innerHTML =
      '<div class="vtm-mark">VTM14 <span>ViralTech Market</span></div>' +
      '<h1>Licence déjà activée</h1>' +
      '<p class="intro">Aucun nouveau code ne sera demandé sur cet appareil.</p>' +
      '<p class="verified">✓ Licence enregistrée localement — ViralTech Market</p>' +
      '<p id="launchInfo" class="launch-info">' +
      (offline ? "Démarrage depuis les fichiers mémorisés" : "Préparation de l’environnement") +
      '</p>';
    promo();
    promoTimer = setInterval(promo, 1800);
    var n = 0;
    launchTimer = setInterval(function () {
      n++;
      var info = document.getElementById("launchInfo");
      if (info) info.textContent = PROMOS[n % PROMOS.length][1];
      if (n >= 4) {
        stopTimers();
        location.href = "jb.html?log=1&afterglow=run&mode=goldhen";
      }
    }, 750);
  }
  async function activateOnline(code) {
    if (busy) return;
    if (!/^[0-9]{10}$/.test(code)) {
      setStatus("Le code doit contenir exactement 10 chiffres.", "error");
      return;
    }
    if (!deviceId) {
      setStatus("Le stockage local sécurisé est indisponible. Vérifiez les paramètres du navigateur.", "error");
      return;
    }
    busy = true;
    if (button) button.disabled = true;
    if (codeInput) codeInput.disabled = true;
    setStatus("Première activation : vérification en ligne…", "pending");
    try {
      var response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, deviceId: deviceId }),
        cache: "no-store"
      });
      var result = await response.json().catch(function () { return {}; });
      var accepted = response.ok && (
        result.activated === true || result.valid === true || result.success === true
      );
      if (!accepted) {
        setStatus(result.message || result.error || "Code refusé ou service d’activation indisponible. Aucun démarrage lancé.", "error");
        return;
      }
      var record = {
        id: "active",
        schema: 2,
        activated: true,
        deviceId: deviceId,
        activatedAt: Date.now(),
        licenseId: typeof result.licenseId === "string" ? result.licenseId : "",
        serverProof: typeof result.token === "string" ? result.token : ""
      };
      await saveRecord(record);
      beginAutomatically(false);
    } catch (error) {
      setStatus(error && error.message ? error.message : "Activation impossible. Vérifiez Internet et l’espace de stockage, puis réessayez.", "error");
    } finally {
      busy = false;
      if (button) button.disabled = false;
      if (codeInput) codeInput.disabled = false;
    }
  }
  async function boot() {
    promo();
    promoTimer = setInterval(promo, 3000);

    // Une activation enregistrée est prioritaire : aucun appel réseau et aucun
    // nouveau formulaire, même hors connexion.
    var savedRecord = await readRecord();
    if (savedRecord) {
      safeRemove(LEGACY_CODE_KEY);
      beginAutomatically(!navigator.onLine);
      return;
    }

    // Migration de l'ancienne version : le code anciennement mémorisé est
    // validé une dernière fois en ligne, puis remplacé par un état sans code.
    var legacyCode = safeGet(LEGACY_CODE_KEY);
    if (/^[0-9]{10}$/.test(legacyCode) && navigator.onLine) {
      if (codeInput) codeInput.value = legacyCode;
      await activateOnline(legacyCode);
      return;
    }
    if (!navigator.onLine) {
      setStatus("Première activation requise en ligne. Après validation, le démarrage sera disponible hors connexion.", "error");
    } else {
      setStatus("Saisissez votre code pour effectuer la première activation.", "");
    }
  }

  if (form) form.addEventListener("submit", function (event) {
    event.preventDefault();
    activateOnline(codeInput ? codeInput.value.trim() : "");
  });
  if (codeInput) codeInput.addEventListener("input", function () {
    codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 10);
  });

  boot().catch(function () {
    setStatus("Impossible de lire la licence locale. Ne supprimez pas les données du navigateur ; redémarrez la page.", "error");
  });
})();
