import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { IopReconciliation } from "./IopReconciliation";

it("records the source cutoff and reviewer identity in a reviewed synthetic close", () => {
  render(<IopReconciliation />);

  fireEvent.click(
    screen.getByRole("button", { name: "Load synthetic source import" }),
  );
  expect(screen.getByText("IOP_IMPORT_001")).toBeVisible();
  expect(screen.getByText("2028-02-07T23:59:59.999Z")).toBeVisible();
  expect(screen.getByText("All derived gaps have reviewed exception records.")).toBeVisible();

  const close = screen.getByRole("button", { name: "Record reviewed close" });
  expect(close).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Close reviewer identity"), {
    target: { value: "REVIEWER_002" },
  });
  expect(close).toBeEnabled();
  fireEvent.click(close);

  expect(screen.getByText("REVIEWER_002")).toBeVisible();
  expect(screen.getByText("5 reviewed of 5 derived")).toBeVisible();
});
