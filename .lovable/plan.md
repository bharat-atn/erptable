

## Plan: Make Candidate View Submit Create Real Records

### Problem
Currently, when you use the AI Test Data Generator in the Candidate View (preview) and click "Submit this form", it only shows a toast saying "simulated". The data is lost. You want it to actually create a real employee, invitation (ACCEPTED), and draft contract in the database — exactly like the "Add Dummy" button does in the Invitations view.

### Changes

**`src/components/dashboard/OnboardingPreview.tsx`**

1. Import `useOrg`, `useQueryClient`, `useMutation`, `supabase`, and `personalInfoSchema` from zod.
2. Replace the simulated `handleSubmit` with a real mutation that:
   - Validates the form data with `personalInfoSchema`
   - Creates an employee record with status `ONBOARDING` and the filled `personal_info`
   - Creates an invitation with status `ACCEPTED` and the selected language
   - Creates a draft contract linked to the employee and the org's first company
   - Invalidates the relevant query caches (invitations, operations, contracts, register)
3. Show a success toast with a message like "Submission created — visible in Invitations and Operations" and offer to close the preview automatically (or just show a confirmation screen).
4. Track `isSubmitting` state from the mutation's `isPending`.

### Technical Detail

The logic mirrors `addDummyInvitation` in `InvitationsView.tsx` but uses the actual form data instead of `generateDummyEmployee()`:

```typescript
const submitReal = useMutation({
  mutationFn: async (data: PersonalInfo) => {
    const personalInfo = {
      preferredName: data.preferredName,
      address1: data.address1,
      // ... all personal_info fields
      bankName: isOtherBank ? data.otherBankName : selectedBank,
      emergencyContact: { firstName: data.emergencyFirstName, ... },
    };

    // 1. Create employee
    const { data: emp } = await supabase.from("employees").insert([{
      first_name: data.firstName,
      last_name: data.lastName,
      middle_name: data.middleName,
      email: data.email,
      phone: data.mobilePhone,
      city: data.city,
      country: data.country,
      status: "ONBOARDING",
      personal_info: personalInfo,
      org_id: orgId,
    }]).select("id").single();

    // 2. Create ACCEPTED invitation
    await supabase.from("invitations").insert([{
      employee_id: emp.id,
      org_id: orgId,
      type: "NEW_HIRE",
      language: previewLanguage,
      status: "ACCEPTED",
    }]);

    // 3. Create draft contract
    const { data: company } = await supabase.from("companies")
      .select("id").eq("org_id", orgId).limit(1).single();
    await supabase.from("contracts").insert([{
      employee_id: emp.id,
      org_id: orgId,
      company_id: company?.id || null,
      status: "draft",
      signing_status: "not_sent",
      season_year: new Date().getFullYear().toString(),
    }]);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["invitations"] });
    queryClient.invalidateQueries({ queryKey: ["operations-employees"] });
    // ... etc
    toast.success("Submitted! The candidate now appears in Invitations and Operations.");
  },
});
```

### Result
After generating AI test data and clicking Submit, the form creates a real employee + completed invitation + draft contract. You can then close the Candidate View, go to Invitations (shows as Completed), and continue to the contract wizard to create the employment contract.

