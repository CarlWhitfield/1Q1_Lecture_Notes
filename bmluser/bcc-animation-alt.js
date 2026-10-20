window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("bcc-animation-alt");
  if (!container) return;

  const img = document.createElement("img");

  img.src =
    "https://www.image2url.com/r2/default/gifs/1792394772510-f4981fdf-f123-435d-ac18-b14e68481fb6.gif";

  img.alt =
    "Animation showing an alternative primitive unit cell of tungsten.";

  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.margin = "0 auto";

  container.appendChild(img);
});