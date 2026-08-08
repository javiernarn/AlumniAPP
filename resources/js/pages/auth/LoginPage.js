import React from 'react';
import  { Formlogin } from '~/components'

const LoginPage = () => {
    let url = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    return(
        <>
           <div className="login-container">
                <Formlogin />
           </div>
        </>
    )
}

export default React.memo(LoginPage);