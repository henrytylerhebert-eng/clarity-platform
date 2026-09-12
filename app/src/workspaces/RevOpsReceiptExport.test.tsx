import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {ReceiptExport} from "./RevOpsReceiptExport";
import {apiRevOps,apiRevOpsExport} from "../domain/api";
import type {RevOpsExportDocument} from "../../../packages/domain-contracts/src/revOps";
vi.mock("../domain/api",()=>({apiRevOps:vi.fn(),apiRevOpsExport:vi.fn(),describeApiError:()=>"Access revoked or receipt changed"}));
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.clearAllMocks();});
const doc:RevOpsExportDocument={templateVersion:"v1",receiptHash:"a".repeat(64),receiptRevision:7,workspaceRevision:14,period:"2028-02",filename:"census-2028-02-receipt-7.xlsx",sheets:[{name:"Summary",rows:[["Metric","Daily Midnight Census Count"],["Actual",280],["Variance percent",-10/290]]}]};
it("reviews exact receipt before sending its hash and observed revision for download",async()=>{
  vi.mocked(apiRevOps).mockResolvedValue(doc);vi.mocked(apiRevOpsExport).mockResolvedValue(new Blob(["test"]));
  const create=vi.fn().mockReturnValue("blob:synthetic");Object.defineProperty(URL,"createObjectURL",{value:create,configurable:true});Object.defineProperty(URL,"revokeObjectURL",{value:vi.fn(),configurable:true});
  vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
  render(<ReceiptExport workspaceId="w" receiptRevision={7}/>);
  expect(screen.queryByRole("button",{name:/Download selected/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Review Excel export"));
  expect(await screen.findByText("280")).toBeVisible();
  expect(screen.getByText("-3.45%")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:/Download selected/}));
  await waitFor(()=>expect(apiRevOpsExport).toHaveBeenCalledWith("/workspaces/w/receipts/7/export",{workspaceRevision:14,receiptHash:doc.receiptHash}));
  expect(await screen.findByText(/Opening or saving the file is not confirmed/)).toBeVisible();expect(create).toHaveBeenCalledOnce();
});
it("clears rejected review and does not offer a stale download after permission loss",async()=>{
  vi.mocked(apiRevOps).mockResolvedValue(doc);vi.mocked(apiRevOpsExport).mockRejectedValue(new Error("revoked"));
  render(<ReceiptExport workspaceId="w" receiptRevision={7}/>);fireEvent.click(screen.getByText("Review Excel export"));
  fireEvent.click(await screen.findByRole("button",{name:/Download selected/}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Access revoked");
  expect(screen.queryByRole("button",{name:/Download selected/})).not.toBeInTheDocument();
});
it("ignores an older receipt response after switching the selected receipt",async()=>{
  let resolve!:(v:RevOpsExportDocument)=>void;
  vi.mocked(apiRevOps).mockImplementationOnce(()=>new Promise(r=>{resolve=r as typeof resolve;})).mockResolvedValueOnce({...doc,receiptRevision:10,filename:"revised.xlsx",sheets:[{name:"Summary",rows:[["Actual",285]]}]});
  const view=render(<ReceiptExport workspaceId="w" receiptRevision={7}/>);fireEvent.click(screen.getByText("Review Excel export"));
  view.rerender(<ReceiptExport workspaceId="w" receiptRevision={10}/>);
  expect(await screen.findByText("285")).toBeVisible();resolve(doc);
  await waitFor(()=>expect(screen.queryByText("280")).not.toBeInTheDocument());
});
