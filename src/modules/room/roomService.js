const { RespError } = require("../../common/utils/response");
const mongoose = require("mongoose");
const Room = require("../../models/room");
const User = require("../../models/user");
const { isEmpty } = require("../../common/utils/app_functions");
const RoomRequest = require("../../models/roomRequest");
const appError = require("../../common/utils/appError");

async function createRoom(request) {
  const { name } = request.body;
  const userId = request.user.id;
  try {
    const oldRoom = await Room.findOne({
      name: name,
      createdBy: userId,
      deletedAt: null,
    });
    if (!oldRoom) {
      return await Room.create({
        name: name,
        createdBy: userId,
        members: [userId],
      });
    } else {
      throw new appError(httpStatus.CONFLICT, request.t("room.ROOM_EXISTENT"));
    }
  } catch (error) {
    throw new appError(httpStatus.CONFLICT, error.message);
  }
}

async function addMemberToRoom(params, currentUser) {
  try {
    const room = await Room.findOne({ _id: params.roomId });
    if (!isEmpty(room)) {
      const user = await User.findOne({ _id: params.userId });
      if (!isEmpty(user)) {
        const oldRoomRequest = await RoomRequest.findOne({
          roomId: params.roomId,
          userId: params.userId,
        });

        if (isEmpty(oldRoomRequest) && !room.members.includes(params.userId)) {
          const roomRequest = await RoomRequest.create({
            roomId: params.roomId,
            userId: params.userId,
          });
          returnVal.data = roomRequest;
        } else {
          returnVal.error = new RespError(
            400,
            "Request already created of this user to the room."
          );
        }
      } else {
        returnVal.error = new RespError(404, "User not found");
      }
    } else {
      returnVal.error = new RespError(404, "Room not found");
    }
  } catch (error) {
    returnVal.error = new RespError(500, error.message);
  }
  return returnVal;
}

async function getRoomRequest(params, currentUser) {
  const returnVal = {};
  try {
    const roomRequests = await RoomRequest.aggregate([
      { $match: { userId: currentUser._id } },
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
    ]);
    returnVal.data = roomRequests;
  } catch (error) {
    returnVal.error = new RespError(500, error.message);
  }
  return returnVal;
}

async function actionOnRoomRequest(params, currentUser) {
  const returnVal = {};
  try {
    const roomRequest = await RoomRequest.findOne({
      _id: params.roomRequestId,
      userId: currentUser._id,
      status: "pending",
    });
    if (!isEmpty(roomRequest)) {
      roomRequest.status = params.status;
      if (params.status == "accepted") {
        const room = await Room.findOneAndUpdate(
          { _id: roomRequest.roomId },
          { $push: { members: currentUser._id } }
        );
      }
      await roomRequest.save();
      returnVal.data = roomRequest;
    } else {
      returnVal.error = new RespError(404, "Room request not found");
    }
  } catch (error) {
    returnVal.error = new RespError(500, error.message);
  }
  return returnVal;
}

async function getMyRooms(request) {
  try {
    const rooms = await Room.aggregate([
      { $match: { members: new mongoose.Types.ObjectId(currentUser._id) } },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "users",
        },
      },
    ]);
    returnVal.data = rooms;
  } catch (error) {
    returnVal.error = new RespError(500, error.message);
  }
  return returnVal;
}

module.exports = {
  createRoom,
  addMemberToRoom,
  getRoomRequest,
  actionOnRoomRequest,
  getMyRooms,
};
