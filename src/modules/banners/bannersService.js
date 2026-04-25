const appError = require("../../common/utils/appError");
const httpStatus = require("../../common/utils/status.json");
const { deleteFromS3 } = require("../../common/utils/uploadToS3");
const Banners = require("../../models/banners");

async function createBanner(request) {
  if (!request.files || !Array.isArray(request.files.banners)) {
    throw new appError(
      httpStatus.BAD_REQUEST,
      "No banners found in the request."
    );
  }
  const banners = request.files.banners.map(async (banner) => {
    if (!banner || !banner.location) {
      throw new appError(httpStatus.BAD_REQUEST, "Invalid banner data.");
    }
    return Banners.create({
      image: banner.location,
    });
  });

  return await Promise.all(banners);
}
async function getBanners(request) {
  return await Banners.find();
}

const deleteBanner = async (request) => {
  try {
    const banner = await Banners.findById(request.params.id);
    await deleteFromS3(banner.image);
    return await Banners.findByIdAndDelete(request.params.id);
  } catch (error) {
    throw new appError(httpStatus.BAD_REQUEST, error.message);
  }
};
const editBanner = async (request) => {
  try {
    const banner = await Banners.findById(request.params.id);
    await deleteFromS3(banner.image);
    return await Banners.findByIdAndUpdate(
      request.params.id,
      { image: request?.files?.banners[0]?.location },
      { new: true }
    );
  } catch (error) {
    throw new appError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  createBanner,
  getBanners,
  deleteBanner,
  editBanner,
};
