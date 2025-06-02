(function () {
  const selectors = {
    orderA_rows: '#orderA-rows',
    orderA_cols: '#orderA-cols',
    createA: '#create-matrixA',
    matrixA_grid: '#matrixA-grid',
    addRowA: '#add-rowA',
    addColA: '#add-colA',

    orderB_rows: '#orderB-rows',
    orderB_cols: '#orderB-cols',
    createB: '#create-matrixB',
    matrixB_grid: '#matrixB-grid',
    addRowB: '#add-rowB',
    addColB: '#add-colB',

    matrixB_section: '#matrixB-section',
    panelOperations: '.panel-operations',
    resultMatrix: '#result-matrix',
    stepsArea: '#steps'
  };

  const el = {};
  for (const key in selectors) {
    el[key] = document.querySelector(selectors[key]);
  }

  let matrixA = [], matrixB = [];
  let rowsA = parseInt(el.orderA_rows.value);
  let colsA = parseInt(el.orderA_cols.value);
  let rowsB = parseInt(el.orderB_rows.value);
  let colsB = parseInt(el.orderB_cols.value);

  function createInputCell(row, col) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'matrix-cell';
    input.dataset.row = row;
    input.dataset.col = col;
    input.autocomplete = 'off';
    input.addEventListener('keydown', e => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      const container = input.parentElement;
      let target;
      if (e.key === 'ArrowRight') target = container.querySelector(`input[data-row="${r}"][data-col="${c + 1}"]`);
      if (e.key === 'ArrowLeft') target = container.querySelector(`input[data-row="${r}"][data-col="${c - 1}"]`);
      if (e.key === 'ArrowDown') target = container.querySelector(`input[data-row="${r + 1}"][data-col="${c}"]`);
      if (e.key === 'ArrowUp') target = container.querySelector(`input[data-row="${r - 1}"][data-col="${c}"]`);
      if (target) {
        e.preventDefault();
        target.focus();
      }
    });
    return input;
  }

  function generateMatrixGrid(container, r, c, modelArr) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${c}, 56px)`;
    modelArr.length = 0;
    for (let i = 0; i < r; i++) {
      const rowArr = [];
      for (let j = 0; j < c; j++) {
        const cell = createInputCell(i, j);
        container.appendChild(cell);
        rowArr.push(cell);
      }
      modelArr.push(rowArr);
    }
  }

  function readMatrix(modelArr) {
    return modelArr.map(row => row.map(cell => parseFloat(cell.value) || 0));
  }

  function displayResultMatrix(mat) {
    el.resultMatrix.innerHTML = '';
    if (!mat || mat.length === 0) return;
    el.resultMatrix.style.gridTemplateColumns = `repeat(${mat[0].length}, 56px)`;
    mat.flat().forEach(val => {
      const div = document.createElement('div');
      div.textContent = val.toFixed(2);
      el.resultMatrix.appendChild(div);
    });
  }

  function deepCopyMatrix(matrix) {
    return matrix.map(row => row.slice());
  }

  const matOps = {
    add: (A, B) => A.map((row, i) => row.map((val, j) => val + B[i][j])),
    subtract: (A, B) => A.map((row, i) => row.map((val, j) => val - B[i][j])),
    multiply: (A, B) => {
      const res = [];
      for (let i = 0; i < A.length; i++) {
        const row = [];
        for (let j = 0; j < B[0].length; j++) {
          let sum = 0;
          for (let k = 0; k < A[0].length; k++) {
            sum += A[i][k] * B[k][j];
          }
          row.push(sum);
        }
        res.push(row);
      }
      return res;
    },
    adjoint: (A) => {
      const n = A.length;
      function minorMatrix(M, i, j) {
        return M.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
      }
      function determinant(M) {
        const size = M.length;
        if (size === 1) return M[0][0];
        if (size === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
        return M[0].reduce((sum, val, c) =>
          sum + ((c % 2 === 0 ? 1 : -1) * val * determinant(minorMatrix(M, 0, c))), 0);
      }
      const cofactors = A.map((row, i) =>
        row.map((_, j) =>
          ((i + j) % 2 === 0 ? 1 : -1) * determinant(minorMatrix(A, i, j))
        )
      );
      return cofactors[0].map((_, i) => cofactors.map(row => row[i])); // transpose
    },
    determinant: (M) => {
      if (M.length !== 3 || M[0].length !== 3) return null;
      return (
        M[0][0] * M[1][1] * M[2][2] +
        M[0][1] * M[1][2] * M[2][0] +
        M[0][2] * M[1][0] * M[2][1] -
        M[0][2] * M[1][1] * M[2][0] -
        M[0][0] * M[1][2] * M[2][1] -
        M[0][1] * M[1][0] * M[2][2]
      );
    },
    transpose: (M) => M[0].map((_, j) => M.map(row => row[j])),
    obe: (A) => {
      function obeRref(matrix) {
        let A = deepCopyMatrix(matrix);
        const rows = A.length;
        const cols = A[0].length;
        let lead = 0;

        for (let r = 0; r < rows; r++) {
          if (lead >= cols) break;
          let i = r;
          while (A[i][lead] === 0) {
            i++;
            if (i === rows) {
              i = r;
              lead++;
              if (lead === cols) return A;
            }
          }
          [A[i], A[r]] = [A[r], A[i]];
          let lv = A[r][lead];
          if (lv !== 0) {
            for (let j = 0; j < cols; j++) A[r][j] /= lv;
          }
          for (let k = 0; k < rows; k++) {
            if (k !== r) {
              let lv2 = A[k][lead];
              for (let j = 0; j < cols; j++) A[k][j] -= lv2 * A[r][j];
            }
          }
          lead++;
        }
        return A;
      }

oke: (A) => {
  function okeRref(matrix) {
    let A = deepCopyMatrix(matrix);
    const rows = A.length;
    const cols = A[0].length;
    let lead = 0;

    for (let c = 0; c < cols; c++) {
      if (lead >= rows) break;
      let i = c;
      while (A[lead][i] === 0) {
        i++;
        if (i === cols) {
          i = c;
          lead++;
          if (lead === rows) return A;
        }
      }
      for (let k = 0; k < rows; k++) {
        let temp = A[k][i];
        A[k][i] = A[k][c];
        A[k][c] = temp;
      }
      let lv = A[lead][c];
      if (lv !== 0) {
        for (let k = 0; k < rows; k++) A[k][c] /= lv;
      }
      for (let j = 0; j < cols; j++) {
        if (j !== c) {
          let lv2 = A[lead][j];
          for (let k = 0; k < rows; k++) {
            A[k][j] -= lv2 * A[k][c];
          }
        }
      }
      lead++;
    }

    return A;
  }

  return { res: okeRref(A), steps: 'Operasi Kolom Elementer selesai.' };
}

inverse: (A) => {
  const n = A.length;
  if (n !== A[0].length) return { res: null, steps: 'Bukan matriks bujursangkar.' };

  let I = A.map((row, i) =>
    row.map((_, j) => (i === j ? 1 : 0))
  );
  let AI = A.map((row, i) => row.concat(I[i]));
  const m = AI.length;
  const totalCols = AI[0].length;

  for (let i = 0; i < m; i++) {
    // Cari pivot
    let maxRow = i;
    for (let k = i + 1; k < m; k++) {
      if (Math.abs(AI[k][i]) > Math.abs(AI[maxRow][i])) maxRow = k;
    }
    if (AI[maxRow][i] === 0) return { res: null, steps: 'Matriks tidak invertibel.' };

    [AI[i], AI[maxRow]] = [AI[maxRow], AI[i]];

    // Normalize pivot row
    const pivot = AI[i][i];
    for (let j = 0; j < totalCols; j++) AI[i][j] /= pivot;

  
    for (let k = 0; k < m; k++) {
      if (k !== i) {
        const factor = AI[k][i];
        for (let j = 0; j < totalCols; j++) AI[k][j] -= factor * AI[i][j];
      }
    }
  }

  const inverseMatrix = AI.map(row => row.slice(n));
  return { res: inverseMatrix, steps: 'Invers matriks selesai.' };
}


      return { res: obeRref(A), steps: 'Operasi Baris Elementer selesai.' };
    }
  };

  function toggleMatrixB(show) {
    el.matrixB_section.classList.toggle('hidden', !show);
  }

  function updateMatrix(type) {
    if (type === 'A') {
      rowsA = parseInt(el.orderA_rows.value);
      colsA = parseInt(el.orderA_cols.value);
      generateMatrixGrid(el.matrixA_grid, rowsA, colsA, matrixA);
    } else {
      rowsB = parseInt(el.orderB_rows.value);
      colsB = parseInt(el.orderB_cols.value);
      generateMatrixGrid(el.matrixB_grid, rowsB, colsB, matrixB);
    }
    clearResult();
  }

  function clearResult() {
    displayResultMatrix([]);
    el.stepsArea.textContent = '';
  }

  function addDimension(type, dim) {
    if (type === 'A') {
      if (dim === 'row' && rowsA < 10) el.orderA_rows.value = ++rowsA;
      if (dim === 'col' && colsA < 10) el.orderA_cols.value = ++colsA;
      updateMatrix('A');
    } else {
      if (dim === 'row' && rowsB < 10) el.orderB_rows.value = ++rowsB;
      if (dim === 'col' && colsB < 10) el.orderB_cols.value = ++colsB;
      updateMatrix('B');
    }
  }

  // Events
  el.createA.addEventListener('click', () => updateMatrix('A'));
  el.createB.addEventListener('click', () => updateMatrix('B'));
  el.addRowA.addEventListener('click', () => addDimension('A', 'row'));
  el.addColA.addEventListener('click', () => addDimension('A', 'col'));
  el.addRowB.addEventListener('click', () => addDimension('B', 'row'));
  el.addColB.addEventListener('click', () => addDimension('B', 'col'));

  el.panelOperations.addEventListener('click', e => {
    if (!e.target.matches('.op-btn')) return;
    const op = e.target.dataset.op;
    const A = readMatrix(matrixA);
    const B = readMatrix(matrixB);
    let result = null, steps = '';
    toggleMatrixB(['add', 'subtract', 'multiply'].includes(op));

    if (['add', 'subtract'].includes(op)) {
      if (A.length !== B.length || A[0].length !== B[0].length) return alert('Ordo harus sama.');
      result = matOps[op](A, B);
      steps = `Operasi ${op} selesai.`;
    } else if (op === 'multiply') {
      if (A[0].length !== B.length) return alert('Kolom A harus sama dengan baris B.');
      result = matOps.multiply(A, B);
      steps = `Perkalian selesai.`;
    } else if (op === 'transpose') {
      result = matOps.transpose(A);
      steps = 'Transpose selesai.';
    } else if (op === 'adjoint') {
      if (A.length !== A[0].length) return alert('Harus bujursangkar.');
      result = matOps.adjoint(A);
      steps = 'Adjoin selesai.';
    } else if (op === 'determinant') {
      const det = matOps.determinant(A);
      if (det === null) return alert('Hanya 3x3.');
      steps = `Determinan: ${det}`;
    } else if (op === 'obe') {
      const { res, steps: s } = matOps.obe(A);
      result = res;
      steps = s;
    } else if (op === 'oke') {
      const { res, steps: s } = matOps.oke(A);
      result = res;
      steps = s;
    } else if (op === 'inverse') {
      const { res, steps: s } = matOps.inverse(A);
      if (!res) return alert(s);
      result = res;
      steps = s;
}


    displayResultMatrix(result);
    el.stepsArea.textContent = steps;
  });
})();
