import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders profile manager title", () => {
  render(<App />);
  const title = screen.getByText(/gestion de profils/i);
  expect(title).toBeInTheDocument();
});
