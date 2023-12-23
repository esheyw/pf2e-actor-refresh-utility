import { MODULE, CLASS, GARBO, REFRESH_OPTIONS, PHYSICAL_ITEM_TYPES, LABELS } from "./constants.js";
import { fu, localize, ARUError } from "./helpers.js";

export class ActorRefreshUtility {
  #actors = [];
  #notify = false;
  #optsSet = false;

  #_disallowedActorTypes = ["army", "hazard", "vehicle"];
  //which things are allowed to be refreshed on which actor type, and which are default
  #_refreshOptionsList = [
    {
      value: "action",
      allowedActorTypes: ["character", "npc"],
      enabled: false,
    },
    {
      value: "ancestry",
      allowedTypes: ["character"],
      enabled: false,
    },
    {
      value: "heritage",
      allowedTypes: ["character"],
      enabled: false,
    },
    {
      value: "background",
      allowedTypes: ["character"],
      enabled: false,
    },
    {
      value: "class",
      allowedTypes: ["character"],
      enabled: false,
    },
    {
      value: "feat",
      allowedTypes: ["character"],
      enabled: false,
    },
    {
      value: "spell",
      allowedTypes: ["character", "npc"],
      enabled: false,
    },
    {
      value: "inventory",
      allowedTypes: ["character", "npc", "party"],
      enabled: false,
    },
    {
      value: "dance",
      allowedTypes: ["character"],
      enabled: false,
      // checked: true,
    },
  ];
  #_newrefreshOptions = REFRESH_OPTIONS;
  #_otherOpts = {
    backup: null,
    force: null,
    backupPackID: null,
  };

  #_labels = LABELS;

  constructor({ actors = null, actor = null, notify = null, refreshOptions = null, otherOpts = null } = {}) {
    if (!game.user.isGM) {
      throw ARUError(`ARU.Error.GMOnly`, null, true);
    }
    this.#actors = [];
    if (actors) {
      this.setActors(actors, true); //overwrite: true
    } else if (actor) {
      this.setActors(actor, true);
    }
    // this.force = force ?? false;
    // this.backup = backup ?? false;
    // this.backupPackID = null;
    // if (backupPackID) {
    //   this.backupPackID = this.#_getPackIDFromArg(options.backupPackID);
    //   if (!this.backupPackID)
    //     throw ARUError(`ARU.Error.InvalidPack`, { packID: options.backupPackID?.toString() ?? GARBO });
    // }

    this._unrefreshed = {};
    this._refreshed = {};
  }
  async newROD() {
    const renderCallback = (html) => {
      //each actor cell opens the sheet associated with that actor
      const actorCells = html.querySelectorAll(".actor-cell");
      for (const actorCell of actorCells) {
        actorCell.addEventListener("click", async () => {
          const actor = await fromUuid(actorCell.dataset.actor);
          actor.sheet.render(true);
        });
      }
      //the 'Actor Type' 0,0 cell checks/unchecks all
      const selectAll = html.querySelector("thead tr th:first-child");
      selectAll.addEventListener("click", (ev) => {
        const cbs = Array.from(ev.target.closest("form").querySelectorAll("input[type=checkbox]:not([disabled])"));
        const anyUnchecked = cbs.some((cb) => !cb.checked);
        for (const cb of cbs) cb.checked = anyUnchecked;
      });
      //refresh option header cells check/uncheck their column
      const columnHeaders = html.querySelectorAll("thead tr th:not(:first-child)");
      for (const cH of columnHeaders) {
        cH.addEventListener("click", (ev) => {
          const form = ev.target.closest("form");
          const targetType = ev.target.dataset["refreshOption"];
          const cbs = Array.from(
            form.querySelectorAll(`input[type=checkbox][data-refresh-option=${targetType}]:not([disabled])`)
          );
          const anyUnchecked = cbs.some((cb) => !cb.checked);
          for (const cb of cbs) {
            if (ev.ctrlKey) cb.checked = !cb.checked;
            else cb.checked = anyUnchecked;
          }
        });
      }
      // actor type cells check/uncheck their row
      const rowHeaders = html.querySelectorAll("tbody tr td:first-child");
      for (const rH of rowHeaders) {
        rH.addEventListener("click", (ev) => {
          const form = ev.target.closest("form");
          const targetType = ev.target.dataset["actorType"];
          const cbs = Array.from(
            form.querySelectorAll(`input[type=checkbox][data-actor-type=${targetType}]:not([disabled])`)
          );
          const anyUnchecked = cbs.some((cb) => !cb.checked);
          for (const cb of cbs) cb.checked = anyUnchecked;
        });
      }
      // the checkbox and summary for Other Option sections are linked and open/close/check/uncheck each other
      const otherOptionsDetailses = Array.from(html.querySelectorAll('.other-options-container details'));
      for (const details of otherOptionsDetailses) {
        const checkbox = details.querySelector('summary input[type=checkbox]');
        details.addEventListener("toggle", (ev) => {
          checkbox.checked = ev.target.open;
        });
        checkbox.addEventListener("change", (ev) => {
          details.open = ev.target.checked;
        });
      }
      // const backupCheckbox = html.querySelector("input[name=backup]");
      // const backupDetails = html.querySelector(".backup-container");
      // backupCheckbox.addEventListener("change", (ev) => {
      //   backupDetails.open = ev.target.checked;
      // });
      // backupDetails.addEventListener("toggle", (ev) => {
      //   backupCheckbox.checked = ev.target.open;
      // });
      //update the folder options when collection selected changes
      const backupFolderSelect = html.querySelector("select[name=backupFolder]");
      const backupCollectionSelect = html.querySelector("select[name=backupCollection]");
      backupCollectionSelect.addEventListener("change", (ev) => {
        const collection =
          ev.target.value === "world" ? game.collections.get("Actor") : game.packs.get(ev.target.value);
        const newFolders = Handlebars.compile("{{> folderStructureOptions}}")({
          folders: collection._formatFolderSelectOptions(),
        });
        backupFolderSelect.innerHTML = newFolders;
      });
    };

    const templateData = {};
    templateData.actorsByType = this.#actors.reduce((acc, curr) => {
      acc[curr.type] ??= [];
      acc[curr.type].push({
        name: curr.name,
        uuid: curr.uuid,
        img: curr.prototypeToken.texture.src,
      });
      return acc;
    }, {});
    // templateData.actorTypes = [...this.#actors.map((a) => a.type).reduce((acc, curr) => acc.add(curr), new Set())];
    templateData.labels = this.#_labels;
    templateData.refreshOptions = this.#_newrefreshOptions;
    templateData.actorPacks = game.packs
      .filter((p) => p.documentName === "Actor" && !p.locked)
      .reduce((acc, curr) => {
        acc[curr.collection] = curr.title;
        return acc;
      }, {});
    templateData.actorPackFolders = game.collections.get("Actor")._formatFolderSelectOptions();
    // console.warn(templateData);
    const content = await renderTemplate(`modules/${MODULE}/templates/newRefreshOptionsDialog.hbs`, templateData);
    const dialogData = {
      title: localize(`ARU.RefreshOptionsDialog.Title`),
      content,
      close: () => false,
      buttons: {
        refresh: {
          label: `Refresh`,
          icon: `<i class="fa-solid fa-arrows-rotate"></i>`,
          callback: (html) => {
            const forms = Array.from(html.querySelectorAll("form"));
            return forms.reduce((acc, curr) => {
              acc[curr.name] = new FormDataExtended(curr).object;
              return acc;
            }, {});
          },
        },
        cancel: {
          label: `Cancel`,
          icon: `<i class="fa-solid fa-times"></i>`,
          callback: () => false,
        },
      },
      default: `refresh`,
      render: renderCallback,
    };
    const dialogOptions = {
      width: 850,
      jQuery: false,
      classes: ["actor-refresh-utility"],
    };
    return await Dialog.wait(dialogData, dialogOptions);
  }

  #_validateActor(actor) {
    if (!actor || !(actor instanceof Actor)) {
      if (actor instanceof Document) {
        throw ARUError(`ARU.Error.DocumentNotActor`, {
          name: actor?.name ?? GARBO,
          class: actor?.documentName ?? GARBO,
        });
      }
      console.error(actor);
      throw ARUError(`ARU.Error.NotAnActor`);
    }
    if (!(actor.type in this.#_newrefreshOptions)) {
      throw ARUError("ARU.Error.InvalidActorType", { name: actor.name, type: actor.type });
    }
    return true;
  }

  setActors(actors, overwrite = false) {
    const provided = Array.isArray(actors) ? actors : [actors];
    const toAdd = [];
    for (const actor of provided) {
      //will throw if invalid
      this.#_validateActor(actor);
      toAdd.push(actor);
    }
    return (this.#actors = overwrite ? toAdd : this.#actors.concat(toAdd));
  }

  get actors() {
    return this.#actors;
  }

  async #_actorSelectPrompt() {
    this.#actors = canvas.tokens.controlled.map((t) => t.actor);
  }

  async refreshActors({ notify = true, prompt = false } = {}) {
    if (!this.#actors.length) {
      if (prompt) {
        await this.#_actorSelectPrompt();
      } else {
        throw ARUError(`ARU.Error.NoActorsProvided`);
      }
    }

    const out = {
      refreshed: [],
      errored: [],
    };
    for (const actor of this.#actors) {
      try {
        out.refreshed.push(this.#_refreshActor(actor));
      } catch (error) {
        out.errors.push({ error, actor });
      }
    }
    if (notify) {
      if (out.refreshed.length) ui.notifications.info(`ARU.Success.ActorsCount`, { count: out.refreshed.length });
      if (out.errors.length) ui.notifications.warn(`ARU.Warning.ActorsCount`, { count: out.errors.length });
    }
    return out;
  }
  /*turns
  {
    "action": true,
    //...
    "optforce": false,
    //...
  }
  into 
  {
    refreshOptions: {
      "action": true,
      //..
    },
    otherOpts: {
      "force": false,
      //...
    }
  }
   */
  #_parseRefreshOptions(response, type = null) {
    //split types of resfresh from other options
    let [refreshOptions, otherOpts] = Object.entries(response).partition((e) => e[0].startsWith("opt"));
    refreshOptions = Object.fromEntries(refreshOptions);
    //strip opt prefix
    otherOpts = Object.fromEntries(
      otherOpts.map((e) => {
        e[0] = e[0].slice(3);
        return e;
      })
    );
    //cull unselected or disallowed options
    for (const key in refreshOptions) {
      // only check type if passed, the dialog may have done it for us
      if (!(existing = this.#_refreshOptionsList[key]) || (type && !existing.allowedActorTypes.includes(type))) {
        delete refreshOptions[key];
      }
    }
    return { refreshOptions, otherOpts };
  }
  // public API to refresh a single actor. assumes you're passing it options unless prompt=true
  async refreshActor(actor, { notify = true, prompt = false, options = {} } = {}) {
    const { refreshOptions, otherOpts } = prompt
      ? this.#_refreshOptionsPrompt(actor)
      : this.#_parseRefreshOptions(options);
    return this.#_refreshActor(actor, { refreshOptions, otherOpts, notify });
  }

  async #_refreshActor(
    actor,
    {
      notify = false,
      refreshOptions = {},
      otherOpts = {
        force: false,
        backup: false,
      },
    }
  ) {
    //TODO

    let response;
    if (prompt) {
      response = await this.#_refreshOptionsPrompt();
      if (!response) return false;
    } else {
    }
    console.warn(types);

    const unrefreshed = {};
    const refreshed = {};
    refreshOptions = Object.entries(response)
      .filter(([type, selected]) => selected && !type.startsWith("opt"))
      .map(([t, s]) => t);
    if (response.backup) {
      this._backup(actor);
    }
    return true;
  }

  async #_refreshOptionsPrompt(actor = null) {
    actor ??= this.#actors[0];
    const renderCallback = (html) => {
      const checkboxes = html.querySelectorAll("#refresh-types input[type=checkbox]");

      const selectAll = html.querySelector("#select-all");
      selectAll.addEventListener("click", () => {
        for (const box of checkboxes) box.checked = true;
      });
      const invert = html.querySelector("#invert");
      invert.addEventListener("click", () => {
        for (const box of checkboxes) box.checked = !box.checked;
      });
    };

    const templateData = {
      actor,
      tokenImage: actor.prototypeToken.texture.src,
      labels: this.#_labels,
      options: this.#_refreshOptionsList,
    };
    const content = await renderTemplate(`modules/${MODULE}/templates/refreshOptions.hbs`, templateData);
    const dialogData = {
      title: localize(`ARU.RefreshOptionsDialog.Title`),
      content,
      close: () => false,
      buttons: {
        refresh: {
          label: `Refresh`,
          icon: `<i class="fa-solid fa-arrows-rotate"></i>`,
          callback: (html) => new FormDataExtended(html.querySelector("form")).object,
        },
        cancel: {
          label: `Cancel`,
          icon: `<i class="fa-solid fa-times"></i>`,
          callback: () => false,
        },
      },
      default: `refresh`,
      render: renderCallback,
    };
    const dialogOptions = {
      width: 350,
      jQuery: false,
      classes: ["actor-refresh-utility"],
    };
    return this.#_parseRefreshOptions(Dialog.wait(dialogData, dialogOptions));
  }

  #_getPackIDFromArg(pack) {
    if (typeof pack === "string") {
      if (!pack.match(/^[\w\-]+\.[\w\-]+$/)) {
        throw ARUError(`ARU.Error.`);
      }
      return pack;
    }
    if (pack instanceof Collection) return pack.collection;
    return null;
  }

  async _backup(actor = null) {
    actor ??= this.#actors[0];
    const options = {};
    if (this.backupPackID) {
      options.pack = this.backupPackID;
    }
    return Actor.create(actor.toObject(), options);
  }

  attemptForceRefresh(item) {
    //TODO
    //..
  }

  async dance(actor = null) {
    actor ??= this.#actors[0];
    const currentLevel = actor.level;
    await actor.update({ "system.details.level.value": 0 });
    await actor.update({ "system.details.level.value": currentLevel });
  }
}
