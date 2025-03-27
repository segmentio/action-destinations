export const hosts: { [key: string]: string } = {
  US: 'https://function.zaius.app/twilio_segment',
  EU: 'https://function.eu1.ocp.optimizely.com/twilio_segment',
  AU: 'https://function.au1.ocp.optimizely.com/twilio_segment'
}

export const getDOBDetails = (dob: string | null | number | undefined) => {
  if ( dob === undefined || dob === null || dob === '') { 
    return undefined
  }
  
  const date = new Date(dob)
  
  if(isNaN(date.getTime())) { 
    return undefined
  }

  return { 
    dob_year: date.getFullYear(), dob_month: date.getMonth() + 1, dob_day: date.getDate() 
  }
}

