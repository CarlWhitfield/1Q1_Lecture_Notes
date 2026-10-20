window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("bcc-animation");
  if (!container) return;

  const img = document.createElement("img");

  img.src =
    "https://www.image2url.com/r2/default/gifs/1792394708188-489af7bc-5027-47b1-b5a6-c61b3f54c1ed.gif";

  img.alt =
    "Animation showing the primitive unit cell of tungsten.";

  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.margin = "0 auto";

  container.appendChild(img);
});