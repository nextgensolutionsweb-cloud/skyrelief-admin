import fs from 'fs';

let content = fs.readFileSync('src/app/marriages/form/page.js', 'utf8');

const oldSave = `
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.plan_id || !form.member_id || !form.marriage_date) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('plan_id', form.plan_id);
      formData.append('member_id', form.member_id);
      formData.append('marriage_date', form.marriage_date);
      if (form.notes) formData.append('notes', form.notes);
      
      if (cardFile) {
        formData.append('invitation_card', cardFile);
      }

      if (isEditMode) {
        formData.append('id', marriageId);
      }

      const endpoint = isEditMode ? '/api/marriage/update' : '/api/marriage/create';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });

      if (res.s === 1) {
        showToast(isEditMode ? 'Marriage record updated successfully' : 'Marriage record added successfully', 'success');
        router.push('/marriages');
      } else {
        showToast(res.m || 'Failed to save marriage record', 'error');
      }
    } catch (err) {
      console.error('Error saving marriage:', err);
      showToast('Error saving record.', 'error');
    } finally {
      setSaving(false);
    }
  };
`;

const newSave = `
  const selectedPlan = plans.find(p => String(p.id) === String(form.plan_id));
  const isDeathPlan = selectedPlan && Number(selectedPlan.plan_type) === 2;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.plan_id || !form.member_id || !form.marriage_date) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    if (isDeathPlan && !form.amount_given) {
      showToast('Please enter the settlement amount for death claim.', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('plan_id', form.plan_id);
      formData.append('member_id', form.member_id);
      formData.append('death_date', form.marriage_date); // works for both
      formData.append('marriage_date', form.marriage_date);
      if (form.notes) formData.append('notes', form.notes);
      
      if (isDeathPlan && form.amount_given) {
        formData.append('amount_given', form.amount_given);
      }
      
      if (cardFile) {
        formData.append(isDeathPlan ? 'photo' : 'invitation_card', cardFile);
      }

      if (isEditMode) {
        formData.append('id', marriageId);
      }

      let endpoint = '';
      if (isDeathPlan) {
         endpoint = isEditMode ? '/api/death/update' : '/api/death/create';
      } else {
         endpoint = isEditMode ? '/api/marriage/update' : '/api/marriage/create';
      }

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });

      if (res && res.s === 1) {
        showToast(isEditMode ? 'Event updated successfully' : 'Event added successfully', 'success');
        router.push('/marriages');
      } else {
        showToast(res?.m || 'Failed to save event', 'error');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      showToast('Error saving event.', 'error');
    } finally {
      setSaving(false);
    }
  };
`;

content = content.replace(oldSave, newSave);

const oldInputs = `
            {/* Marriage Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Marriage Date *</label>
              <input
                type="date"
                required
                value={form.marriage_date}
                onChange={e => handleInputChange('marriage_date', e.target.value)}
                className="premium-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Documents Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <FileText size={18} className="text-blue-500" /> Documents & Notes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Invitation Card Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Invitation Card (Photo/PDF)</label>
`;

const newInputs = `
            {/* Event Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>{isDeathPlan ? 'Death Date *' : 'Marriage Date *'}</label>
              <input
                type="date"
                required
                value={form.marriage_date}
                onChange={e => handleInputChange('marriage_date', e.target.value)}
                className="premium-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Amount Given (Only for Death Plans) */}
            {isDeathPlan && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Amount Given (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.amount_given}
                  onChange={e => handleInputChange('amount_given', e.target.value)}
                  className="premium-input"
                  style={{ width: '100%' }}
                  placeholder="Enter settlement amount"
                />
              </div>
            )}
          </div>
        </div>

        {/* Documents Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <FileText size={18} className="text-blue-500" /> Documents & Notes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>{isDeathPlan ? 'Death Certificate (Photo/PDF)' : 'Invitation Card (Photo/PDF)'}</label>
`;

content = content.replace(oldInputs, newInputs);

const oldTitle1 = `
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
            {isEditMode ? 'Edit Marriage Record' : 'Register New Marriage'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
            {isEditMode ? 'Update schedules and replace documents' : 'Fill details to add a new marriage event'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Marriage & Member Information Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            💍 Marriage & Member Information
          </h2>
`;

const newTitle1 = `
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
            {isEditMode ? 'Edit Event Record' : 'Register New Event'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
            {isEditMode ? 'Update event details and replace documents' : 'Fill details to add a new event'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Marriage & Member Information Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            💍 Event & Member Information
          </h2>
`;

content = content.replace(oldTitle1, newTitle1);

fs.writeFileSync('src/app/marriages/form/page.js', content);
console.log('Done part 2');
