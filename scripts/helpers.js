const fu = foundry.utils;
const localize = (str, data = {}) => game.i18n.format(str, data);
const ARUError = (str, data = {}, notify=false) => {
  const errorstr = `ActorRefreshUtility: ` + localize(str, data);
  if (notify) ui.notifications.error(errorstr) 
  return Error(errorstr);
}
export {localize, ARUError, fu}