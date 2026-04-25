const Profile = require("../../models/profile");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");

const createProfile = async (request) => {
    const userData = {
        userId: request.user.id,
        userName: request.body.userName,
        fullName: request.body.fullName,
        email: request.body.email,
        mobileNo: request.body.mobileNo,
        isArtOfLivingTeacher: request.body.isTeacher === true,
    };

    if (userData.isArtOfLivingTeacher) {
        if (!request.body.teacherId) {
            throw new appError(httpStatus.BAD_REQUEST, 'Teacher ID is required for Art of Living Teachers');
        }
        if (!request.file) {
            throw new appError(httpStatus.BAD_REQUEST, 'Document is required for Art of Living Teachers');
        }
        userData.teacherId = request.body.teacherId;
        userData.documentPath = request.file.path;
    }
    const newProfile = await Profile.create(userData);
    return newProfile;

};

const getProfiles = async () => {
    const profiles = await Profile.find();
    if (!profiles.length) {
        throw new appError(httpStatus.NOT_FOUND, 'Profiles not found');
    }
    return profiles;
};

const getProfileById = async (id) => {
    const profile = await Profile.findById(id);
    if (!profile) {
        throw new appError(httpStatus.NOT_FOUND, 'Profile not found');
    }
    return profile;
};

const editProfile = async (id, request) => {
    const userData = {
        username: request.body.username,
        fullName: request.body.fullName,
        email: request.body.email,
        mobileNo: request.body.mobileNo,
        isArtOfLivingTeacher: request.body.isArtOfLivingTeacher === 'true',
    };

    if (userData.isArtOfLivingTeacher) {
        if (!request.body.teacherId) {
            throw new appError(httpStatus.BAD_REQUEST, 'Teacher ID is required for Art of Living Teachers');
        }
        userData.teacherId = request.body.teacherId;

        if (request.file) {
            userData.documentPath = request.file.path;
        }
    }

    const updatedProfile = await Profile.findByIdAndUpdate(id, userData, { new: true, runValidators: true });
    if (!updatedProfile) {
        throw new appError(httpStatus.NOT_FOUND, 'Profile not found');
    }
    return updatedProfile;
};

const deleteProfile = async (id) => {
    const deletedProfile = await Profile.findByIdAndDelete(id);
    if (!deletedProfile) {
        throw new appError(httpStatus.NOT_FOUND, 'Profile not found');
    }
    return deletedProfile;
};

module.exports = {
    createProfile,
    getProfiles,
    getProfileById,
    editProfile,
    deleteProfile,
};