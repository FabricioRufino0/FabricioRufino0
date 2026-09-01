// Build a single self-contained animated SVG: Pac-Man serpentines across the
// contribution grid, and each square fades out just as he reaches it.
// Light/dark is handled with a prefers-color-scheme media query, so one file
// works in both GitHub themes when embedded with <img>.

const CELL = 12;
const GAP = 3;
const PITCH = CELL + GAP;
const MARGIN_X = 14;
const MARGIN_Y = 14;
const R = CELL * 0.85;
const SECONDS_PER_CELL = 0.12;
const CHOMP = 0.45;
const MOUTH_OPEN = 45;
const MOUTH_SHUT = 2;

const round = (n) => Math.round(n * 100) / 100;

const ROWS = 7;
const opposite = (r) => (r === 0 ? ROWS - 1 : 0);

const exists = (grid, w, d) => !!(grid[w] && grid[w][d]);

function neighbors(grid, w, d) {
  const out = [];

  if (exists(grid, w, d - 1)) out.push([w, d - 1]);
  if (exists(grid, w, d + 1)) out.push([w, d + 1]);
  if (exists(grid, w - 1, d)) out.push([w - 1, d]);
  if (exists(grid, w + 1, d)) out.push([w + 1, d]);

  return out;
}

function randomHamiltonian(grid, rand, tries) {
  const cells = [];

  for (let w = 0; w < grid.length; w++) {
    for (let d = 0; d < ROWS; d++) {
      if (exists(grid, w, d)) {
        cells.push([w, d]);
      }
    }
  }

  const total = cells.length;
  const start = cells[0];

  for (let t = 0; t < tries; t++) {
    const seen = new Set([`${start[0]},${start[1]}`]);
    const path = [start];

    let cur = start;

    for (;;) {
      const open = neighbors(grid, cur[0], cur[1]).filter(
        ([w, d]) => !seen.has(`${w},${d}`)
      );

      if (open.length === 0) {
        break;
      }

      let min = Infinity;
      let candidates = [];

      for (const neighbor of open) {
        const degree = neighbors(
          grid,
          neighbor[0],
          neighbor[1]
        ).filter(
          ([w, d]) => !seen.has(`${w},${d}`)
        ).length;

        if (degree < min) {
          min = degree;
          candidates = [neighbor];
        } else if (degree === min) {
          candidates.push(neighbor);
        }
      }

      cur =
        candidates[
          Math.floor(rand() * candidates.length)
        ];

      seen.add(`${cur[0]},${cur[1]}`);
      path.push(cur);
    }

    if (path.length === total) {
      return path;
    }
  }

  return null;
}

function zonePath(grid, rand) {
  const width = grid.length;

  const order = [];

  let column = 0;
  let startRow = 0;

  while (column < width) {
    const zoneWidth =
      3 + Math.floor(rand() * 6);

    const endColumn =
      Math.min(column + zoneWidth, width);

    const actualWidth =
      endColumn - column;

    const vertical =
      rand() < 0.5;

    if (vertical) {
      let row = startRow;

      for (
        let currentColumn = column;
        currentColumn < endColumn;
        currentColumn++
      ) {
        if (row === 0) {
          for (
            let day = 0;
            day < ROWS;
            day++
          ) {
            order.push([
              currentColumn,
              day,
            ]);
          }
        } else {
          for (
            let day = ROWS - 1;
            day >= 0;
            day--
          ) {
            order.push([
              currentColumn,
              day,
            ]);
          }
        }

        row = opposite(row);
      }

      startRow =
        actualWidth % 2 === 1
          ? opposite(startRow)
          : startRow;
    } else {
      const rowSequence =
        startRow === 0
          ? [0, 1, 2, 3, 4, 5, 6]
          : [6, 5, 4, 3, 2, 1, 0];

      let direction = 1;

      for (const day of rowSequence) {
        if (direction === 1) {
          for (
            let currentColumn = column;
            currentColumn < endColumn;
            currentColumn++
          ) {
            order.push([
              currentColumn,
              day,
            ]);
          }
        } else {
          for (
            let currentColumn = endColumn - 1;
            currentColumn >= column;
            currentColumn--
          ) {
            order.push([
              currentColumn,
              day,
            ]);
          }
        }

        direction = -direction;
      }

      startRow = opposite(startRow);
    }

    column = endColumn;
  }

  return order.filter(
    ([w, d]) => exists(grid, w, d)
  );
}

function backbite(
  grid,
  path,
  rand,
  moves
) {
  const key = (cell) =>
    `${cell[0]},${cell[1]}`;

  const positions = new Map(
    path.map((cell, index) => [
      key(cell),
      index,
    ])
  );

  const length = path.length;

  const swap = (a, b) => {
    const temp = path[a];

    path[a] = path[b];
    path[b] = temp;

    positions.set(
      key(path[a]),
      a
    );

    positions.set(
      key(path[b]),
      b
    );
  };

  for (let move = 0; move < moves; move++) {
    const tail =
      rand() < 0.5;

    const end =
      tail
        ? path[length - 1]
        : path[0];

    const adjacent =
      neighbors(
        grid,
        end[0],
        end[1]
      );

    const randomNeighbor =
      adjacent[
        Math.floor(
          rand() *
            adjacent.length
        )
      ];

    const index =
      positions.get(
        key(randomNeighbor)
      );

    if (tail) {
      if (
        index >=
        length - 2
      ) {
        continue;
      }

      for (
        let a = index + 1,
          b = length - 1;
        a < b;
        a++, b--
      ) {
        swap(a, b);
      }
    } else {
      if (index <= 1) {
        continue;
      }

      for (
        let a = 0,
          b = index - 1;
        a < b;
        a++, b--
      ) {
        swap(a, b);
      }
    }
  }

  return path;
}

export function pathOrder(grid) {
  const rand = Math.random;

  const seed =
    randomHamiltonian(
      grid,
      rand,
      500
    ) ||
    zonePath(
      grid,
      rand
    );

  return backbite(
    grid,
    seed,
    rand,
    seed.length * 14
  );
}

const cx = (week) =>
  MARGIN_X +
  week * PITCH +
  CELL / 2;

const cy = (day) =>
  MARGIN_Y +
  day * PITCH +
  CELL / 2;

function pacPath(thetaDeg) {
  const theta =
    (thetaDeg * Math.PI) / 180;

  const upperX =
    round(
      R *
        Math.cos(theta)
    );

  const upperY =
    round(
      -R *
        Math.sin(theta)
    );

  const lowerX =
    round(
      R *
        Math.cos(theta)
    );

  const lowerY =
    round(
      R *
        Math.sin(theta)
    );

  return (
    `M0,0 ` +
    `L${upperX},${upperY} ` +
    `A${R},${R} 0 1,0 ` +
    `${lowerX},${lowerY} Z`
  );
}

function eatAnim(
  position,
  fadeWidth,
  duration
) {
  const start =
    round(position);

  const end =
    round(
      Math.min(
        position +
          fadeWidth,
        1
      )
    );

  let keyTimes;
  let values;

  if (start <= 0) {
    keyTimes =
      `0;${end || 0.001};1`;

    values =
      "1;0;0";
  } else if (end >= 1) {
    keyTimes =
      `0;${start};1`;

    values =
      "1;1;0";
  } else {
    keyTimes =
      `0;${start};${end};1`;

    values =
      "1;1;0;0";
  }

  return `
    <animate
      attributeName="opacity"
      dur="${duration}s"
      repeatCount="indefinite"
      values="${values}"
      keyTimes="${keyTimes}"
    />
  `;
}

export function buildSvg(grid) {
  const order =
    pathOrder(grid);

  const totalCells =
    order.length;

  const duration =
    round(
      totalCells *
        SECONDS_PER_CELL
    );

  const fadeWidth =
    0.28 /
    totalCells;

  const width =
    MARGIN_X * 2 +
    grid.length *
      PITCH -
    GAP;

  const height =
    MARGIN_Y * 2 +
    7 *
      PITCH -
    GAP;

  const orderIndex =
    new Map();

  order.forEach(
    ([week, day], index) => {
      orderIndex.set(
        `${week},${day}`,
        index
      );
    }
  );

  const emptyCells = [];
  const squares = [];
  const pellets = [];

  for (
    let week = 0;
    week < grid.length;
    week++
  ) {
    for (
      let day = 0;
      day < ROWS;
      day++
    ) {
      const cell =
        grid[week][day];

      if (!cell) {
        continue;
      }

      const x =
        round(
          MARGIN_X +
            week *
              PITCH
        );

      const y =
        round(
          MARGIN_Y +
            day *
              PITCH
        );

      const index =
        orderIndex.get(
          `${week},${day}`
        );

      const position =
        totalCells > 1
          ? index /
            (totalCells - 1)
          : 0;

      const eat =
        eatAnim(
          position,
          fadeWidth,
          duration
        );

      emptyCells.push(`
        <rect
          class="empty"
          x="${x}"
          y="${y}"
          width="${CELL}"
          height="${CELL}"
          rx="2"
        />
      `);

      if (cell.level > 0) {
        const pulse =
          cell.level === 4
            ? `
              <animate
                attributeName="opacity"
                dur="1s"
                repeatCount="indefinite"
                values="1;0.55;1"
                keyTimes="0;0.5;1"
              />
            `
            : "";

        squares.push(`
          <rect
            class="l${cell.level}"
            x="${x}"
            y="${y}"
            width="${CELL}"
            height="${CELL}"
            rx="2"
          >
            ${pulse}
            ${eat}
          </rect>
        `);
      } else {
        pellets.push(`
          <circle
            class="pellet"
            cx="${round(
              x +
                CELL / 2
            )}"
            cy="${round(
              y +
                CELL / 2
            )}"
            r="1.6"
          >
            ${eat}
          </circle>
        `);
      }
    }
  }

  const motion =
    "M" +
    order
      .map(
        ([week, day]) =>
          `${round(
            cx(week)
          )},${round(
            cy(day)
          )}`
      )
      .join(" L");

  const pacman = `
    <g class="pac">

      <path d="${pacPath(
        MOUTH_SHUT
      )}">

        <animate
          attributeName="d"
          dur="${CHOMP}s"
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;0.5;1"
          keySplines="
            0.4 0 0.6 1;
            0.4 0 0.6 1
          "
          values="
            ${pacPath(
              MOUTH_SHUT
            )};
            ${pacPath(
              MOUTH_OPEN
            )};
            ${pacPath(
              MOUTH_SHUT
            )}
          "
        />

      </path>

      <animateMotion
        dur="${duration}s"
        repeatCount="indefinite"
        rotate="auto"
        path="${motion}"
        keyPoints="0;1"
        keyTimes="0;1"
        calcMode="linear"
      />

    </g>
  `;

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  font-family="sans-serif"
>

  <style>

    :root {
      --empty: #ebedf0;

      --l1: #9be9a8;
      --l2: #40c463;
      --l3: #30a14e;
      --l4: #216e39;

      --pac: #ffd93b;
      --pellet: #e0a92e;
    }

    @media (prefers-color-scheme: dark) {

      :root {
        --empty: #161b22;

        --l1: #0e4429;
        --l2: #006d32;
        --l3: #26a641;
        --l4: #39d353;

        --pac: #ffd93b;
        --pellet: #ffe08a;
      }

    }

    .empty {
      fill: var(--empty);
    }

    .l1 {
      fill: var(--l1);
    }

    .l2 {
      fill: var(--l2);
    }

    .l3 {
      fill: var(--l3);
    }

    .l4 {
      fill: var(--l4);
    }

    .pac {
      fill: var(--pac);
    }

    .pellet {
      fill: var(--pellet);
    }

  </style>

  <g>
    ${emptyCells.join("")}
  </g>

  <g>
    ${pellets.join("")}
  </g>

  <g>
    ${squares.join("")}
  </g>

  ${pacman}

</svg>
`;
}
