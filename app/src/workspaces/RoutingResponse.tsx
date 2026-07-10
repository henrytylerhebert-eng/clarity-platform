import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { validateFacilityResponse } from "../domain/guardrails";
import type { FacilityReferral, FacilityResponse } from "../domain/types";

interface Props {
  referrals: FacilityReferral[];
  responses: FacilityResponse[];
  onResponse: (response: FacilityResponse) => void;
}

export function RoutingResponse({ referrals, responses, onResponse }: Props) {
  const firstReferral = referrals[0];
  const [response, setResponse] = useState<FacilityResponse["response"]>("Request more info");
  const [reasonCode, setReasonCode] = useState("packet incomplete");
  const [error, setError] = useState<string | null>(null);

  function submitResponse(referralId: string) {
    const validation = validateFacilityResponse(response, reasonCode);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onResponse({
      id: `resp-${Date.now()}`,
      referralId,
      response,
      reasonCode: reasonCode.trim(),
      note: `${response} entered in local prototype.`,
      respondedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Routing Response</h2>
        <p>Simulated receiving-facility response. No live hospital network transmission.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Status</th>
              <th>Latest response</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => {
              const referralResponses = responses.filter((item) => item.referralId === referral.id);
              const latest = referralResponses[referralResponses.length - 1];
              return (
                <tr key={referral.id}>
                  <td>{referral.facilityName}</td>
                  <td><StatusBadge tone={referral.status === "Accepted" ? "good" : referral.status === "Declined" ? "danger" : "info"}>{referral.status}</StatusBadge></td>
                  <td>{latest?.response ?? "Pending"}</td>
                  <td>{latest?.reasonCode ?? "Unknown"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {firstReferral ? (
        <div className="response-composer">
          <select value={response} onChange={(event) => setResponse(event.target.value as FacilityResponse["response"])}>
            <option>Accept</option>
            <option>Decline</option>
            <option>Request more info</option>
            <option>Waitlist</option>
          </select>
          <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} aria-label="Reason code">
            <option>no bed available</option>
            <option>acuity too high</option>
            <option>medical exclusion</option>
            <option>age mismatch</option>
            <option>payer issue</option>
            <option>packet incomplete</option>
            <option>staffing constraint</option>
            <option>other</option>
          </select>
          <button className="secondary-button" type="button" onClick={() => submitResponse(firstReferral.id)}>Record mock response</button>
        </div>
      ) : null}
      {error ? <p className="inline-warning">{error}</p> : null}
    </section>
  );
}
