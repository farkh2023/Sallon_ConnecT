'use strict';
/* =============================================
   mediaRegistry.js
   Point d'entrée unique pour tous les connecteurs multimédias
============================================= */

const youtube      = require('./youtubeConnector');
const localGallery = require('./localGalleryConnector');
const adb          = require('./adbConnector');
const dlna         = require('./dlnaConnector');
const smartThings  = require('./smartThingsConnector');

/* Retourne le statut de tous les connecteurs */
function getAllStatuses() {
  return {
    youtube:      youtube.getStatus(),
    localGallery: localGallery.getStatus(),
    adb:          adb.getStatus(),
    dlna:         dlna.getStatus(),
    smartThings:  smartThings.getStatus(),
  };
}

/* Retourne les capacités de tous les connecteurs */
function getAllCapabilities() {
  return {
    youtube:      youtube.getCapabilities(),
    localGallery: localGallery.getCapabilities(),
    adb:          adb.getCapabilities(),
    dlna:         dlna.getCapabilities(),
    smartThings:  smartThings.getCapabilities(),
  };
}

module.exports = {
  youtube,
  localGallery,
  adb,
  dlna,
  smartThings,
  getAllStatuses,
  getAllCapabilities,
};
