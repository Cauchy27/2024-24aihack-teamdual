import Head from 'next/head';
import dynamic from 'next/dynamic';
import LocalMediaProvider from '@/providers/LocalMediaContext';
import BroadcastProvider from '@/providers/BroadcastContext';
import UserSettingsProvider from '@/providers/UserSettingsContext';
import ModalProvider from '@/providers/ModalContext';
import BroadcastLayoutProvider from '@/providers/BroadcastLayoutContext';
import BroadcastMixerProvider from '@/providers/BroadcastMixerContext';

const BroadcastApp = dynamic(() => import('@/components/BroadcastApp'), {
  ssr: false,
});

export default function Broadcast() {
  const title = `超正直な発表メーカー`;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name='description'
          content='発表者の心の声が聞こえる、プレゼン補助アプリです。'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <ModalProvider>
        <UserSettingsProvider>
          <LocalMediaProvider>
            <BroadcastProvider>
              <BroadcastMixerProvider>
                <BroadcastLayoutProvider>
                  <BroadcastApp />
                </BroadcastLayoutProvider>
              </BroadcastMixerProvider>
            </BroadcastProvider>
          </LocalMediaProvider>
        </UserSettingsProvider>
      </ModalProvider>
    </>
  );
}
