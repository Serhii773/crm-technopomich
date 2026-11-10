import { useState } from 'react';

export default function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const bind = (name) => ({
    name,
    value: values[name],
    className: errors[name] ? 'invalid' : undefined,
    onChange: (e) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    },
  });
  const reset = () => { setValues(initial); setErrors({}); };
  return { values, setValues, errors, setErrors, bind, reset };
}
