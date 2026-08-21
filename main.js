<body>
<script>
document.addEventListener('DOMContentLoaded', () => {
  let tamanhoPorcentagem = 100;
  const limiteMinimo = 70;
  const limiteMaximo = 150;
  const passo = 10;

  const btnAumentar = document.getElementById('btn-aumentar');
  const btnDiminuir = document.getElementById('btn-diminuir');
  const btnResetar = document.getElementById('btn-resetar');

  function atualizarFonte() {
    // Altera a raiz para CSS que usa 'rem'
    document.documentElement.style.fontSize = `${tamanhoPorcentagem}%`;
    // Altera o body para garantir funcionamento mesmo em CSS que usa 'px'
    document.body.style.fontSize = `${(tamanhoPorcentagem / 100) * 16}px`;
  }

  if (btnAumentar) {
    btnAumentar.addEventListener('click', () => {
      if (tamanhoPorcentagem < limiteMaximo) {
        tamanhoPorcentagem += passo;
        atualizarFonte();
      }
    });
  }

  if (btnDiminuir) {
    btnDiminuir.addEventListener('click', () => {
      if (tamanhoPorcentagem > limiteMinimo) {
        tamanhoPorcentagem -= passo;
        atualizarFonte();
      }
    });
  }

  if (btnResetar) {
    btnResetar.addEventListener('click', () => {
      tamanhoPorcentagem = 100;
      atualizarFonte();
    });
  }
});
</script>
</body>