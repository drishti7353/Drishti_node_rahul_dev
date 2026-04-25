const bannersService = require("./bannersService");
const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const createResponse = require("../../common/utils/createResponse");

const createBanners = async (request, response) => {
  try {
    const data = await bannersService.createBanner(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Banner.UnableToCreateBanner")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Banner.CreateBanner"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const getBanners = async (request, response) => {
  try {
    const data = await bannersService.getBanners(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Banner.UnableToGetBanner")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Banner.BannerFetched"),
      data
    );
  } catch (error) {
    console.error(error);
    createResponse(response, error.status, error.message);
  }
};
const deleteBanners = async (request, response) => {
  try {
    const data = await bannersService.deleteBanner(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Banner.UnableToDeleteBanner")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Banner.BannerDeleted"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};
const editBanners = async (request, response) => {
  try {
    const data = await bannersService.editBanner(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("Banner.UnableToEditBanner")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("Banner.EditBanner"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

module.exports = {
  createBanners,
  getBanners,
  deleteBanners,
  editBanners,
};
