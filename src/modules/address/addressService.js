const Address = require("../../models/address");
const User = require('../../models/user');


async function createAddressService(request) {
  const { title, city, state, country, pin, address, userId, latlong } = request.body;

  const saveAddress = new Address({
    title,
    address,
    city,
    state,
    country,
    pin,
    latlong: {
      type: 'Point',
      coordinates: latlong.coordinates,
    },
    userId,
  });

  //console.log('Address to save:', saveAddress);

  try {
    return await saveAddress.save();
  } catch (error) {
    throw new Error("Error saving address: " + error.message);
  }
}


const getNearbyVisibleUsers = async (longitude, latitude, radius = 1000) => {
  try {
    const addresses = await Address.find({
      latlong: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      },
    })

    const users = await User.find({
      _id: { $in: addresses.map(addr => addr.userId) },
      locationSharing: true,
      nearByVisible: true
    }).select("userName profileImage role");

    return users;
  } catch (error) {
    throw new Error("Error fetching nearby users: " + error.message);
  }
};



const getAllAddressesByUserIdService = async (request) => {
  const { userId } = request.params;
  const addresses = await Address.find({ userId });

  if (!addresses.length) {
    //console.log("No addresses found for this user");
    return null;
  }

  return addresses;
};


async function updateAddressService(request) {
  const { id } = request.params;
  const updateData = request.body;

  if (!id) {
    //console.log("ID is not found");
    return null;
  }
  const updatedAddress = await Address.findByIdAndUpdate(id, updateData, { new: true });

  if (!updatedAddress) {
    //console.log("Address not found for the provided ID");
    return null;
  }
  return updatedAddress;
}

async function deleteAddressService(request) {
  const { id } = request.params;
  return await Address.findByIdAndDelete(id);
}



module.exports = {
  createAddressService,
  updateAddressService,
  deleteAddressService,
  getAllAddressesByUserIdService,
  getNearbyVisibleUsers
};

