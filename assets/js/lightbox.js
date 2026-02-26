document.addEventListener("DOMContentLoaded", function () {
  // Select images from both project listings and single posts
  const images = document.querySelectorAll(
    ".project-full-content img, .post-content img, .page-content img",
  );

  // Create lightbox overlay
  const overlay = document.createElement("div");
  overlay.id = "lightbox-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  overlay.style.display = "none";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "10000";
  overlay.style.cursor = "zoom-out";
  document.body.appendChild(overlay);

  const largeImage = document.createElement("img");
  largeImage.style.maxWidth = "95%";
  largeImage.style.maxHeight = "95%";
  largeImage.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.2)";
  largeImage.style.borderRadius = "4px";
  overlay.appendChild(largeImage);

  // Add click event to images
  images.forEach((img) => {
    // Skip if image is inside a link (already handled usually) or if it's the avatar
    // Also check if it's a small icon or explicitly excluded
    if (img.parentElement.tagName === "A" || img.closest(".avatar") || img.closest(".no-lightbox")) {
      return;
    }

    // Optional: Check size to exclude tiny icons?
    // For now, we trust the selectors and the .avatar exclusion.
    // We can also check if naturalWidth is very small, but naturalWidth might be 0 if not loaded.
    // Let's just apply to content images.

    // Add class to apply CSS styles
    img.classList.add("lightbox-enabled");

    img.addEventListener("click", function () {
      largeImage.src = this.src;
      overlay.style.display = "flex";
      document.body.style.overflow = "hidden";
    });
  });

  // Close lightbox on click
  overlay.addEventListener("click", function () {
    overlay.style.display = "none";
    document.body.style.overflow = ""; // Restore scrolling
  });
});
