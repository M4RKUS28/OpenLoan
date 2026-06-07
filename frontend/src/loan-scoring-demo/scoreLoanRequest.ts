import { fetchCdiTransactionRiskEnrichment } from "./cdiClient";
import { getBorrowerScoreRecord } from "./mockBorrowerDb";
import {
  TRANSACTION_COMPONENT_DEFINITIONS,
  buildBorrowerScoreComponents,
  buildLocalTransactionComponents,
  buildScoreComponent,
  getInternalShowstopper,
  sumWeightedPoints,
} from "./scoringRules";
import { round2 } from "./utils";
import type {
  LoanScoreResult,
  LoanScoringInput,
  MockCdiTransactionRiskEnrichmentResponse,
  ScoreComponent,
  ScoreLoanRequestOptions,
  TransactionComponentKey,
} from "./types";

export async function scoreLoanRequest(
  input: LoanScoringInput,
  options: ScoreLoanRequestOptions = {},
): Promise<LoanScoreResult> {
  const borrowerRecord = getBorrowerScoreRecord(input.borrower_id);
  const borrowerComponents = buildBorrowerScoreComponents(borrowerRecord);
  const localTransactionScores = buildLocalTransactionComponents(input, borrowerRecord);
  let showstopper = getInternalShowstopper(input) ?? localTransactionScores.showstopper;
  let cdiResponse: MockCdiTransactionRiskEnrichmentResponse | null = null;

  try {
    cdiResponse = await fetchCdiTransactionRiskEnrichment(input, borrowerRecord, options);
  } catch {
    if (!showstopper) {
      showstopper = "CDI mock API unavailable.";
    }
  }

  const cdiHardStopMessage = cdiResponse?.hard_stop_flags?.[0]?.message;

  if (cdiHardStopMessage) {
    showstopper = cdiHardStopMessage;
  }

  const cdiComponents = buildCdiTransactionComponents(cdiResponse);
  const transactionComponents = TRANSACTION_COMPONENT_DEFINITIONS.map(
    (definition) =>
      localTransactionScores.components[definition.key] ??
      cdiComponents[definition.key] ??
      buildScoreComponent(definition, 0),
  );
  const borrowerScore = sumWeightedPoints(borrowerComponents);
  const transactionScore = sumWeightedPoints(transactionComponents);

  return {
    request_id: input.request_id,
    borrower_id: input.borrower_id,
    total_score: round2(borrowerScore + transactionScore),
    borrower_score: borrowerScore,
    transaction_score: transactionScore,
    showstopper,
    borrower_components: borrowerComponents,
    transaction_components: transactionComponents,
  };
}

function buildCdiTransactionComponents(
  cdiResponse: MockCdiTransactionRiskEnrichmentResponse | null,
): Partial<Record<TransactionComponentKey, ScoreComponent>> {
  return {
    verified_trade_shipment: buildScoreComponent(
      getCdiDefinition("verified_trade_shipment"),
      cdiResponse?.risk_signals.trade_shipment_verification.score_0_100 ?? 0,
    ),
    supplier_reliability: buildScoreComponent(
      getCdiDefinition("supplier_reliability"),
      cdiResponse?.risk_signals.supplier_reliability.score_0_100 ?? 0,
    ),
    cdi_order_normality: buildScoreComponent(
      getCdiDefinition("cdi_order_normality"),
      cdiResponse?.risk_signals.order_normality.score_0_100 ?? 0,
    ),
    buyer_channel_concentration: buildScoreComponent(
      getCdiDefinition("buyer_channel_concentration"),
      cdiResponse?.risk_signals.buyer_channel_concentration.score_0_100 ?? 0,
    ),
  };
}

function getCdiDefinition(key: TransactionComponentKey) {
  const definition = TRANSACTION_COMPONENT_DEFINITIONS.find((candidate) => candidate.key === key);

  if (!definition) {
    throw new Error(`Unknown CDI score component: ${key}`);
  }

  return definition;
}
