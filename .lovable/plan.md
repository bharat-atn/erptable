

## Plan: Expand Fallback Bank List to Match Full Database

### Problem
The `FALLBACK_BANKS_BY_COUNTRY` hardcoded list in `OnboardingWizard.tsx` only contains 24 banks (4 Sweden, 7 Romania, 4 Thailand, 4 Moldova, 5 Ukraine). The database has 73 banks. When the database fetch fails or returns empty (e.g., in demo/preview mode without authentication, or if the RPC encounters an error), candidates only see the 24 fallback banks instead of the full list.

Similarly, the `DEFAULT_BANKS` seed list in `BankListView.tsx` only has 24 entries.

### Fix

**File: `src/components/onboarding/OnboardingWizard.tsx`**

Replace the `FALLBACK_BANKS_BY_COUNTRY` constant (lines 28-63) with the complete list of 73 banks matching the database:

- **Sweden**: 11 banks (add Avanza, Danske Bank, ICA Banken, Lansforsakringar, SBAB, Skandia, Svenska Handelsbanken)
- **Romania**: 24 banks (add all major Romanian banks: Banca Centrala Cooperatista, Garanti BBVA, Intesa Sanpaolo, Libra Internet Bank, Nexent Bank, Patria Bank, Revolut Bank, Salt Bank, TechVentures Bank, Vista Bank, etc.)
- **Thailand**: 20 banks (add Bank of Ayudhya, CIMB Thai, Government banks, Islamic Bank, Kiatnakin Phatra, Land and Houses, Standard Chartered, TMBThanachart, United Overseas Bank, etc.)
- **Moldova**: 13 banks (add BCR Chisinau, Comertbank, Energbank, EuroCreditBank, Eximbank, FinComBank, Mobiasbanca, ProCredit Bank)
- **Ukraine**: 5 banks (unchanged)

**File: `src/components/dashboard/BankListView.tsx`**

Update the `DEFAULT_BANKS` constant (lines 351-374) to match the same expanded list, so the "Seed Default Banks" button seeds all 73 banks.

### Result
- Candidates always see the full ~73 bank list regardless of whether the database fetch succeeds
- The "Seed Default Banks" admin button populates the complete bank registry

