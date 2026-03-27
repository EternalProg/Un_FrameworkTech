function toPublicImageUrl(imagePath, request) {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  return `${request.protocol}://${request.host}/uploads${imagePath}`;
}

function withPublicImageUrl(item, request) {
  return {
    ...item,
    image: toPublicImageUrl(item.image, request),
  };
}

export { toPublicImageUrl, withPublicImageUrl };
