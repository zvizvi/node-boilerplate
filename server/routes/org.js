const express = require('express');

const { permissions, parseJson } = require('../utils');
const OrgCtrl = require('../controllers/org');
const AgentCtrl = require('../controllers/agent');

const router = express.Router();

router.get('/:orgId', (req, res) => {
  const { orgId } = req.params;
  const { user } = req;

  return OrgCtrl.findById(orgId, user)
    .then((org) => res.jsonSuccess(org))
    .catch((error) => res.jsonError(error));
});

router.get('/', permissions.middleware.isSuperuser, (req, res) => {
  const params = parseJson(req.query.params);
  const { user } = req;

  return OrgCtrl.list(user, params)
    .then((org) => res.jsonSuccess(org))
    .catch((error) => res.jsonError(error));
});

router.put('/:orgId', permissions.middleware.isAdmin, (req, res) => {
  const { orgId } = req.params;
  const { user } = req;
  const { org } = req.body;

  return OrgCtrl.update(orgId, org, user)
    .then((org) => res.jsonSuccess(org))
    .catch((error) => res.jsonError(error));
});

/* settings */
router.get('/:orgId/settings', (req, res) => {
  const { orgId } = req.params;
  const { user } = req;

  return OrgCtrl.findById(orgId, user)
    .then(({ settings, crmSettings }) => res.jsonSuccess({ settings, crmSettings }))
    .catch((error) => res.jsonError(error));
});

router.post('/:orgId/settings', permissions.middleware.isAdmin, (req, res) => {
  const { orgId } = req.params;
  const { settings } = req.body;
  const { user } = req;

  return OrgCtrl.saveSettings(orgId, settings, user)
    .then((updatedOrg) => res.jsonSuccess(updatedOrg))
    .catch((error) => res.jsonError(error));
});

router.post('/:orgId/crm-settings', permissions.middleware.isAdmin, (req, res) => {
  const { orgId } = req.params;
  const { crmSettings } = req.body;
  const { user } = req;

  return OrgCtrl.saveCrmSettings(orgId, crmSettings, user)
    .then((updatedOrg) => res.jsonSuccess(updatedOrg))
    .catch((error) => res.jsonError(error));
});

/* agents */
router.get('/:orgId/agent', permissions.middleware.isAdmin, (req, res) => {
  const { orgId } = req.params;
  const { params } = req.query;
  const { user } = req;

  return AgentCtrl.list(orgId, user, parseJson(params))
    .then((agents) => res.jsonSuccess(agents))
    .catch((error) => res.jsonError(error));
});

router.get('/:orgId/agent/:agentId', (req, res) => {
  const { agentId, orgId } = req.params;

  return AgentCtrl.findById(agentId, orgId, req.user)
    .then((agent) => res.jsonSuccess(agent))
    .catch((error) => res.jsonError(error));
});

router.post('/:orgId/agent', permissions.middleware.isAdmin, (req, res) => {
  const { orgId } = req.params;
  const { agent } = req.body;
  const { user } = req;

  return AgentCtrl.create(orgId, agent, user)
    .then((agent) => res.jsonSuccess(agent))
    .catch((error) => res.jsonError(error));
});

router.put('/:orgId/agent/:agentId', permissions.middleware.isAdmin, (req, res) => {
  const { agentId, orgId } = req.params;
  const { agent } = req.body;
  const { user } = req;

  return AgentCtrl.update(agentId, agent, orgId, user)
    .then((agent) => res.jsonSuccess(agent))
    .catch((error) => res.jsonError(error));
});

router.post('/:orgId/agent/:agentId/exit', permissions.middleware.isAdmin, (req, res) => {
  const { agentId, orgId } = req.params;
  const { user } = req;

  return AgentCtrl.exitAgent(agentId, orgId, user)
    .then((result) => res.jsonSuccess(result))
    .catch((error) => res.jsonError(error));
});

module.exports = router;
