<body>
<script>
  let currentZoom = 100;
  const step = 10; // Porcentagem de aumento/diminuição a cada clique
  const maxZoom = 140; // Limite máximo de 140%
  const minZoom = 80;  // Limite mínimo de 80%

  const htmlElement = document.documentElement;

  document.getElementById('btn-increase').addEventListener('click', () => {
    if (currentZoom < maxZoom) {
      currentZoom += step;
      htmlElement.style.fontSize = `${currentZoom}%`;
    }
  });

  document.getElementById('btn-decrease').addEventListener('click', () => {
    if (currentZoom > minZoom) {
      currentZoom -= step;
      htmlElement.style.fontSize = `${currentZoom}%`;
    }
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    currentZoom = 100;
    htmlElement.style.fontSize = '100%';
  });
</script>
</body>