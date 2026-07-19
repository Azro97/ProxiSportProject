// src/services/supabase.ts
// Single Supabase client for the app. All backend access goes through the
// service files (matchsService, terrainsService, equipesService, tournoiService).
// Components and stores never import this directly.

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
