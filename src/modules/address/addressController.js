const addressService = require("../address/addressService");
const appError = require("../../common/utils/appError");
const createResponse = require("../../common/utils/createResponse");
const httpStatus = require("../../common/utils/status.json");
const { addressCreateV } = require("../address/addressValidation");

const createAddressController = async (request, response) => {
  try {
    // Validate request body first
    const { error, value } = addressCreateV.body.validate(request.body);
    
    if (error) {
      throw new appError(
        httpStatus.BAD_REQUEST,
        error.details[0].message
      );
    }

    const data = await addressService.createAddressService(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("address.UNABLE_TO_CREATE")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("address.ADDRESS_CREATED"),
      data
    );
  } catch (error) {
    createResponse(response, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};
const getNearbyVisibleUser = async (request, response) => {
  const { longitude, latitude, radius } = request.body;

  if (!longitude || !latitude) {
    return createResponse(response, httpStatus.BAD_REQUEST, "Longitude and Latitude are required.");
  }
  try {
    const users = await addressService.getNearbyVisibleUsers(longitude, latitude, radius);

    if (!users.length) {
      throw new appError(httpStatus.NON_AUTHORITATIVE_INFORMATION, "No nearby users found.");
    }

    createResponse(response, httpStatus.OK, "Nearby users fetched successfully.", users);
  } catch (error) {
    createResponse(response, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};



const getAllAddressesByUserIdController = async (req, res) => {
  try {
    const data = await addressService.getAllAddressesByUserIdService(req);
    
    createResponse(
      res,
      httpStatus.OK,
      data ? req.t("address.ADDRESSES_FOUND") : req.t("address.NO_ADDRESSES_FOUND"),
      data || []
    );
  } catch (error) {
    createResponse(res, error.status || httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const updateAddressController = async (request, response) => {
  try {
    const data = await addressService.updateAddressService(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("address.UNABLE_TO_UPDATE")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("address.ADDRESS_UPDATED"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const deleteAddressController = async (request, response) => {
  try {
    const data = await addressService.deleteAddressService(request);
    if (!data) {
      throw new appError(
        httpStatus.NOT_FOUND,
        request.t("address.UNABLE_TO_DELETE")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("address.ADDRESS_DELETED"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};



module.exports = {
  createAddressController,
  updateAddressController,
  deleteAddressController,
  getAllAddressesByUserIdController,
  getNearbyVisibleUser
};
