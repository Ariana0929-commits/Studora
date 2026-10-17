import { useEffect, useState, useSyncExternalStore } from 'react';
import { getUser, handleAuthCallback, login, signup, logout, requestPasswordRecovery, updateUser, AuthError, onAuthChange } from '@netlify/identity';
import { defaultState, replaceState } from './store';
import { Leaf, Cloud, LogOut } from 'lucide-react';
import { cloudStatus, subscribeCloud, loadSpace, saveSpace, hasPendingChanges, importDeviceData, stopCloud } from './cloud';
let startup: ReturnType<typeof initialize> | undefined;
async function initialize() {
  const callback=await handleAuthCallback();
  const user=await getUser();
  if(user) await loadSpace();
  return { user, recovery:callback?.type==='recovery' };
}
export function AccountBoundary({children}:{children:React.ReactNode}) {
  const [phase,setPhase]=useState<'loading'|'auth'|'ready'|'recovery'|'error'>('loading');
  const [mode,setMode]=useState<'login'|'signup'|'forgot'>('login');
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [name,setName]=useState('');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>{let active=true;startup??=initialize();startup.then(({user,recovery})=>{if(active)setPhase(recovery?'recovery':user?'ready':'auth')}).catch(()=>{if(active){setMessage('Unable to open your account. Check your connection and retry.');setPhase('error')}});return()=>{active=false}},[]);
  useEffect(()=>onAuthChange((event)=>{if(event==='logout'){stopCloud();replaceState(structuredClone(defaultState));setPhase('auth')}}),[]);
  if(phase==='ready')return children;
  return <main className="account-shell"><section className="account-story"><Leaf size={40}/><p className="eyebrow">YOUR GENTLE STUDY SPACE</p><h1>A little space.<br/>A lasting home.</h1><p>Your notes, plans, and small steps — together in your Studora account.</p><span>Learn slowly. Keep growing.</span></section><section className="account-card">
    <h2>{phase==='loading'?'Opening your study space…':phase==='recovery'?'Choose a new password':mode==='signup'?'Make yourself at home':mode==='forgot'?'Reset your password':'Welcome back'}</h2>
    {phase==='loading'?<p role="status">Bringing your account and study plans together.</p>:phase==='error'?<><p role="alert">{message}</p><button className="btn btn-primary" onClick={()=>location.reload()}>Retry</button></>:<>
    <p>{phase==='recovery'?'Use at least 10 characters.':mode==='signup'?'Create a permanent account with your email.':mode==='forgot'?'Get a reset link in your inbox.':'Sign in to pick up where you left off.'}</p>
    <form onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{
      if(phase==='recovery'){await updateUser({password});setPhase('ready');setPassword('');return}
      if(mode==='forgot'){await requestPasswordRecovery(email);setMessage('Check your inbox for a password reset link.');return}
      if(mode==='signup'){const user=await signup(email,password,{full_name:name});if(!user.confirmedAt){setMessage('Check your inbox to confirm your email, then return here to sign in.');setPassword('');return}}
      else await login(email,password);
      await loadSpace();setPassword('');setPhase('ready');
    }catch(err){setMessage(err instanceof AuthError?err.message:'Unable to connect. Please try again.')}finally{setBusy(false)}}}>
      {mode==='signup'&&phase!=='recovery'&&<label className="field"><span>Your name</span><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={80}/></label>}
      {phase!=='recovery'&&<label className="field"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}
      {(mode!=='forgot'||phase==='recovery')&&<label className="field"><span>Password</span><input type="password" autoComplete={mode==='signup'||phase==='recovery'?'new-password':'current-password'} required minLength={mode==='signup'||phase==='recovery'?10:1} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
      {message&&<p role="status" className="account-message">{message}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy?'Please wait…':phase==='recovery'?'Save new password':mode==='signup'?'Create account':mode==='forgot'?'Send reset link':'Sign in'}</button>
    </form>
    {phase!=='recovery'&&<div className="account-links">{(['login','signup','forgot'] as const).filter(m=>m!==mode).map(m=><button key={m} className="text-link" disabled={busy} onClick={()=>{setMode(m);setMessage('');setPassword('')}}>{m==='login'?'Sign in':m==='signup'?'Create an account':'Forgot password?'}</button>)}</div>}
    </>}
    <p className="account-privacy"><a href="/privacy.html" target="_blank" rel="noreferrer">Privacy</a> · <a href="/delete-account.html" target="_blank" rel="noreferrer">Account deletion</a></p>
  </section></main>;
}
export function AccountStatus(){
  const status=useSyncExternalStore(subscribeCloud,cloudStatus);
  const [message,setMessage]=useState('');
  return <div className="account-status"><Cloud size={16}/><span role="status">{status}</span><button className="text-link" onClick={()=>void saveSpace()}>Retry save</button><button className="text-link" onClick={()=>{try{importDeviceData();setMessage('Device data imported.')}catch(e){setMessage((e as Error).message)}}}>Import old device data</button><button className="icon-btn" aria-label="Sign out" title="Sign out" onClick={async()=>{await saveSpace();if(hasPendingChanges()){setMessage('Save your changes before signing out.');return}try{await logout();location.reload()}catch{setMessage('Unable to sign out. Please retry.')}}}><LogOut size={16}/></button>{message&&<small role="status">{message}</small>}</div>
}

export function AccountSettings(){
  const [open,setOpen]=useState(false);const [confirmation,setConfirmation]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  return <div className="account-deletion"><button className="text-link" onClick={()=>setOpen(!open)}>Delete my account</button>{open&&<div className="restore-confirm"><p>This permanently deletes your account, study data, and uploaded photos. Export a backup first. Type DELETE to confirm.</p><label className="field"><span>Confirmation</span><input value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off"/></label><button className="btn btn-danger-outline" disabled={confirmation!=='DELETE'||busy} onClick={async()=>{setBusy(true);setError('');try{await saveSpace();if(hasPendingChanges())throw new Error('Resolve pending saves before deleting your account.');await getUser();const res=await fetch('/.netlify/functions/account',{method:'DELETE'});if(!res.ok)throw new Error(await res.text());try{await logout()}catch{}location.reload()}catch(e){setError((e as Error).message);setBusy(false)}}}>{busy?'Deleting…':'Permanently delete account'}</button>{error&&<p role="alert">{error}</p>}</div>}</div>
}
