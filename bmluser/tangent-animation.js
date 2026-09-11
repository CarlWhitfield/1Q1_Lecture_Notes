window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tangent-animation");
  if (!container) return;

  const img = document.createElement("img");

  img.src =
    "https://www.image2url.com/r2/default/gifs/1789052907697-71655270-58bd-4d1f-b112-8cd1b9e1ef77.gif";

  img.alt =
    "Animation showing how the straight line between two points on the curve sin(x) gets closer to a tangent to the curve as we zoom in and reduce h.";

  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.margin = "0 auto";

  container.appendChild(img);
});