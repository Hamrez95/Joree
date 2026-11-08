export type GameKind = 'blocks' | 'snake' | 'pong';
type Cell = { x: number; y: number };
const COLORS = ['#a2ecf1', '#ff9cbb', '#cba5f3', '#ffe17b'];
const SHAPES = [
  [
    [1, 0],
    [1, 1],
    [1, 2],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
];
export function shapePreview(index: number): Cell[] {
  return SHAPES[index].map(([x, y]) => ({ x, y }));
}
export class ArcadeEngine {
  kind: GameKind;
  score = 0;
  opponentScore = 0;
  over = false;
  tickCount = 0;
  snake: Cell[] = [
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
    { x: 4, y: 7 },
  ];
  direction: Cell = { x: 1, y: 0 };
  queuedDirection: Cell = { x: 1, y: 0 };
  food: Cell = { x: 12, y: 9 };
  board: (string | null)[][] = Array.from({ length: 12 }, () => Array(10).fill(null));
  piece: Cell[] = [];
  pieceOrigin: Cell = { x: 3, y: 0 };
  pieceColor = COLORS[0];
  nextShape = 0;
  ball = { x: 200, y: 230, vx: 3, vy: 2.3 };
  paddle = 175;
  opponent = 175;
  constructor(kind: GameKind) {
    this.kind = kind;
    this.spawnPiece();
  }
  tick(speed: number) {
    if (this.over) return;
    this.tickCount++;
    if (this.kind === 'pong') {
      this.tickPong(speed);
      return;
    }
    const interval =
      this.kind === 'snake' ? Math.max(4, 12 - speed * 2) : Math.max(8, 29 - speed * 5);
    if (this.tickCount % interval) return;
    if (this.kind === 'snake') this.tickSnake();
    else this.movePiece(0, 1);
  }
  key(key: string) {
    if (this.over) return;
    if (this.kind === 'snake') {
      const directions: Record<string, Cell> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };
      const next = directions[key];
      if (next && (next.x !== -this.direction.x || next.y !== -this.direction.y))
        this.queuedDirection = next;
    }
    if (this.kind === 'blocks') {
      if (key === 'ArrowLeft') this.movePiece(-1, 0);
      if (key === 'ArrowRight') this.movePiece(1, 0);
      if (key === 'ArrowDown') this.movePiece(0, 1);
      if (key === 'ArrowUp') {
        const rotated = this.piece.map((cell) => ({ x: 2 - cell.y, y: cell.x }));
        if (!this.collides(rotated, this.pieceOrigin)) this.piece = rotated;
      }
      if (key === ' ') {
        while (!this.collides(this.piece, { ...this.pieceOrigin, y: this.pieceOrigin.y + 1 }))
          this.pieceOrigin.y++;
        this.lockPiece();
      }
    }
  }
  movePaddle(y: number) {
    this.paddle = Math.max(0, Math.min(380, y));
  }
  private tickSnake() {
    this.direction = this.queuedDirection;
    const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };
    const eating = head.x === this.food.x && head.y === this.food.y;
    const collisionBody = eating ? this.snake : this.snake.slice(0, -1);
    if (
      head.x < 0 ||
      head.x >= 20 ||
      head.y < 0 ||
      head.y >= 18 ||
      collisionBody.some((cell) => cell.x === head.x && cell.y === head.y)
    ) {
      this.over = true;
      return;
    }
    this.snake.unshift(head);
    if (eating) {
      this.score += 10;
      const free = this.findFreeSnakeCells();
      if (!free.length) {
        this.over = true;
        return;
      }
      this.food = free[Math.floor(Math.random() * free.length)];
    } else this.snake.pop();
  }
  private findFreeSnakeCells(): Cell[] {
    return Array.from({ length: 360 }, (_, index) => ({
      x: index % 20,
      y: Math.floor(index / 20),
    })).filter(
      (cell) => !this.snake.some((segment) => segment.x === cell.x && segment.y === cell.y),
    );
  }
  private collides(cells: Cell[], origin: Cell): boolean {
    return cells.some((cell) => {
      const x = cell.x + origin.x;
      const y = cell.y + origin.y;
      return x < 0 || x >= 10 || y >= 12 || (y >= 0 && this.board[y][x] !== null);
    });
  }
  private spawnPiece() {
    this.piece = SHAPES[this.nextShape].map(([x, y]) => ({ x, y }));
    this.pieceOrigin = { x: 3, y: 0 };
    this.pieceColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.nextShape = Math.floor(Math.random() * SHAPES.length);
    if (this.collides(this.piece, this.pieceOrigin)) this.over = true;
  }
  private movePiece(dx: number, dy: number) {
    const next = { x: this.pieceOrigin.x + dx, y: this.pieceOrigin.y + dy };
    if (!this.collides(this.piece, next)) {
      this.pieceOrigin = next;
      return;
    }
    if (dy > 0) this.lockPiece();
  }
  private lockPiece() {
    for (const cell of this.piece) {
      const x = cell.x + this.pieceOrigin.x;
      const y = cell.y + this.pieceOrigin.y;
      if (y < 0) {
        this.over = true;
        return;
      }
      this.board[y][x] = this.pieceColor;
    }
    const remaining = this.board.filter((row) => row.some((cell) => cell === null));
    const cleared = 12 - remaining.length;
    this.score += cleared * 100;
    this.board = [...Array.from({ length: cleared }, () => Array(10).fill(null)), ...remaining];
    this.spawnPiece();
  }
  private tickPong(speed: number) {
    const ball = this.ball;
    const multiplier = 0.7 + speed * 0.25;
    ball.x += ball.vx * multiplier;
    ball.y += ball.vy * multiplier;
    if (ball.y < 8 || ball.y > 452) ball.vy *= -1;
    this.opponent += Math.sign(ball.y - this.opponent - 40) * Math.min(2.5, speed * 0.7 + 1);
    this.opponent = Math.max(0, Math.min(380, this.opponent));
    if (
      ball.x < 23 &&
      ball.x > 8 &&
      ball.vx < 0 &&
      ball.y >= this.paddle &&
      ball.y <= this.paddle + 80
    ) {
      ball.vx = Math.abs(ball.vx) * 1.03;
      ball.vy = (ball.y - this.paddle - 40) * 0.09;
    }
    if (
      ball.x > 377 &&
      ball.x < 392 &&
      ball.vx > 0 &&
      ball.y >= this.opponent &&
      ball.y <= this.opponent + 80
    )
      ball.vx = -Math.abs(ball.vx);
    if (ball.x < 0 || ball.x > 400) {
      if (ball.x > 400) this.score++;
      else this.opponentScore++;
      this.ball = { x: 200, y: 230, vx: ball.x > 400 ? -3 : 3, vy: 2.3 };
      if (this.score >= 5 || this.opponentScore >= 5) this.over = true;
    }
  }
  draw(context: CanvasRenderingContext2D) {
    const ctx = context;
    ctx.clearRect(0, 0, 400, 460);
    ctx.fillStyle = this.kind === 'snake' ? '#b6ecd0' : '#182650';
    ctx.fillRect(0, 0, 400, 460);
    this.drawGrid(ctx);
    if (this.kind === 'snake') this.drawSnake(ctx);
    if (this.kind === 'blocks') this.drawBlocks(ctx);
    if (this.kind === 'pong') this.drawPong(ctx);
  }
  private drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.kind === 'snake' ? '#91cbb4' : '#2b3b64';
    ctx.lineWidth = 1;
    const columns = this.kind === 'snake' ? 20 : 10;
    for (let x = 0; x <= columns; x++) {
      ctx.beginPath();
      ctx.moveTo((x * 400) / columns, 0);
      ctx.lineTo((x * 400) / columns, 460);
      ctx.stroke();
    }
    const rows = this.kind === 'snake' ? 18 : 12;
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, (y * 460) / rows);
      ctx.lineTo(400, (y * 460) / rows);
      ctx.stroke();
    }
  }
  private drawSnake(ctx: CanvasRenderingContext2D) {
    this.snake.forEach((cell, index) =>
      this.drawBlock(
        ctx,
        cell.x * 20,
        (cell.y * 460) / 18,
        19,
        24,
        index === 0 ? '#62be52' : '#9fe26f',
      ),
    );
    this.drawBlock(ctx, this.food.x * 20, (this.food.y * 460) / 18, 19, 24, '#ff9caa');
    const head = this.snake[0];
    ctx.fillStyle = '#193e26';
    ctx.fillRect(head.x * 20 + 11, (head.y * 460) / 18 + 7, 4, 4);
  }
  private drawBlocks(ctx: CanvasRenderingContext2D) {
    this.board.forEach((row, y) => this.drawBoardRow(ctx, row, y));
    this.piece.forEach((cell) =>
      this.drawBlock(
        ctx,
        (cell.x + this.pieceOrigin.x) * 40,
        ((cell.y + this.pieceOrigin.y) * 460) / 12,
        39,
        38,
        this.pieceColor,
      ),
    );
  }
  private drawBoardRow(ctx: CanvasRenderingContext2D, row: (string | null)[], y: number) {
    row.forEach((color, x) => {
      if (color) this.drawBlock(ctx, x * 40, (y * 460) / 12, 39, 38, color);
    });
  }
  private drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff85';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 4);
    ctx.fill();
    ctx.stroke();
  }
  private drawPong(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#1d2949';
    ctx.fillRect(0, 0, 400, 460);
    ctx.setLineDash([10, 9]);
    ctx.strokeStyle = '#ddd9e9';
    ctx.beginPath();
    ctx.moveTo(200, 0);
    ctx.lineTo(200, 460);
    ctx.stroke();
    ctx.setLineDash([]);
    this.drawBlock(ctx, 8, this.paddle, 14, 80, '#9cebf3');
    this.drawBlock(ctx, 378, this.opponent, 14, 80, '#ffa4c3');
    ctx.fillStyle = '#fff7e9';
    ctx.fillRect(this.ball.x - 5, this.ball.y - 5, 10, 10);
    ctx.font = 'bold 33px Vazirmatn';
    ctx.fillText(String(this.score), 90, 45);
    ctx.fillText(String(this.opponentScore), 290, 45);
  }
}
