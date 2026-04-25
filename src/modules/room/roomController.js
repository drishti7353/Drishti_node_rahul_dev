const httpStatus = require("../../common/utils/status.json");
const roomService = require("./roomService");
const createResponse = require("../../common/utils/createResponse");
const appError = require("../../common/utils/appError");

const createRoom = async (request, response) => {
  try {
    const data = await roomService.createRoom(request);
    if (!data) {
      throw new appError(
        httpStatus.CONFLICT,
        request.t("room.UNABLE_TO_CREATE_ROOM")
      );
    }
    createResponse(
      response,
      httpStatus.OK,
      request.t("room.ROOM_CREATED"),
      data
    );
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const addMemberToRoom = async (request, response) => {
  try {
    const data = await roomService.addMemberToRoom(request);
    if (!data) {
      throw new appError(httpStatus.CONFLICT);
    }
    createResponse(response, httpStatus.OK, msg.message, data);
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const actionOnRoomRequest = async (request, response) => {
  try {
    const data = await roomService.actionOnRoomRequest(
      request.body,
      request.user
    );
    if (!data) {
      throw new appError(httpStatus.CONFLICT);
    }
    createResponse(response, httpStatus.OK, msg.message, data);
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const getRoomRequest = async (request, response) => {
  try {
    const data = await roomService.getRoomRequest(request.query, request.user);
    if (!data) {
      throw new appError(httpStatus.CONFLICT);
    }
    createResponse(response, httpStatus.OK, msg.message, data);
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

const getMyRooms = async (request, response) => {
  try {
    const data = await roomService.getMyRooms(request.query, request.user);
    if (!data) {
      throw new appError(httpStatus.CONFLICT);
    }
    createResponse(response, httpStatus.OK, msg.message, data);
  } catch (error) {
    createResponse(response, error.status, error.message);
  }
};

module.exports = {
  createRoom,
  addMemberToRoom,
  actionOnRoomRequest,
  getRoomRequest,
  getMyRooms,
};
