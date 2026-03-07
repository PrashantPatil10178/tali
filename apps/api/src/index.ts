import { app } from "@/server";

const port = Number(process.env.PORT ?? 3001);

app.listen(port);

console.log(
  `🦊 Tali API listening on http://localhost:${app.server?.port ?? port}`,
);
