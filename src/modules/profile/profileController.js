const profileService = require("./profileService");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const createResponse = require("../../common/utils/createResponse");

const createProfile = async (request, response) => {
    try {
        const data = await profileService.createProfile(request);
        createResponse(response, httpStatus.CREATED, request.t("Profile.ProfileCreated"), data);
    } catch (error) {
        createResponse(response, error.status || httpStatus.BAD_REQUEST, error.message);
    }
};

const getProfiles = async (request, response) => {
    try {
        const data = await profileService.getProfiles();
        createResponse(response, httpStatus.OK, request.t("Profile.ProfilesFetched"), data);
    } catch (error) {
        createResponse(response, error.status || httpStatus.NOT_FOUND, error.message);
    }
};

const getProfileById = async (request, response) => {
    try {
        const data = await profileService.getProfileById(request.params.id);
        createResponse(response, httpStatus.OK, request.t("Profile.ProfileFetched"), data);
    } catch (error) {
        createResponse(response, error.status || httpStatus.NOT_FOUND, error.message);
    }
};

const editProfile = async (request, response) => {
    try {
        const data = await profileService.editProfile(request.params.id, request);
        createResponse(response, httpStatus.OK, request.t("Profile.ProfileEdited"), data);
    } catch (error) {
        createResponse(response, error.status || httpStatus.BAD_REQUEST, error.message);
    }
};

const deleteProfile = async (request, response) => {
    try {
        const data = await profileService.deleteProfile(request.params.id);
        createResponse(response, httpStatus.OK, request.t("Profile.ProfileDeleted"), data);
    } catch (error) {
        createResponse(response, error.status || httpStatus.NOT_FOUND, error.message);
    }
};

module.exports = {
    createProfile,
    getProfiles,
    getProfileById,
    editProfile,
    deleteProfile,
};