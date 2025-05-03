/**
 * Mock IPFS Upload API
 * Simulates IPFS upload with local storage for demo purposes
 *
 * POST /api/ipfs/upload
 * Body: FormData with certificateOfIncorporation, registryExtract, companyInfo
 * Returns: { success, cid?, error? }
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface UploadResponse {
  success: boolean;
  cid?: string;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const file1 = formData.get('certificateOfIncorporation') as File | null;
    const file2 = formData.get('registryExtract') as File | null;
    const companyInfoJson = formData.get('companyInfo') as string | null;

    console.log('[IPFS Mock] Upload request received');

    // Validate files
    if (!file1) {
      return Response.json(
        {
          success: false,
          error: 'Missing certificate of incorporation file',
        } as UploadResponse,
        { status: 400 }
      );
    }

    if (!file2) {
      return Response.json(
        {
          success: false,
          error: 'Missing registry extract file',
        } as UploadResponse,
        { status: 400 }
      );
    }

    if (!companyInfoJson) {
      return Response.json(
        {
          success: false,
          error: 'Missing company info',
        } as UploadResponse,
        { status: 400 }
      );
    }

    console.log('[IPFS Mock] Files received:');
    console.log('[IPFS Mock]   Certificate:', file1.name, file1.size, 'bytes');
    console.log('[IPFS Mock]   Registry:', file2.name, file2.size, 'bytes');

    // Parse company info
    let companyInfo;
    try {
      companyInfo = JSON.parse(companyInfoJson);
    } catch {
      return Response.json(
        {
          success: false,
          error: 'Invalid company info JSON',
        } as UploadResponse,
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate timestamp for unique filenames
    const timestamp = Date.now();

    // Save files locally
    const file1Path = join(uploadDir, `${timestamp}_certificate_${file1.name}`);
    const file2Path = join(uploadDir, `${timestamp}_registry_${file2.name}`);

    const file1Buffer = Buffer.from(await file1.arrayBuffer());
    const file2Buffer = Buffer.from(await file2.arrayBuffer());

    await writeFile(file1Path, file1Buffer);
    await writeFile(file2Path, file2Buffer);

    console.log('[IPFS Mock] Files saved locally:');
    console.log('[IPFS Mock]   ', file1Path);
    console.log('[IPFS Mock]   ', file2Path);

    // Create metadata file
    const metadata = {
      companyInfo,
      documents: {
        certificateOfIncorporation: {
          name: file1.name,
          size: file1.size,
          type: file1.type,
        },
        registryExtract: {
          name: file2.name,
          size: file2.size,
          type: file2.type,
        },
      },
      uploadedAt: new Date().toISOString(),
    };

    const metadataPath = join(uploadDir, `${timestamp}_metadata.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('[IPFS Mock] Metadata saved:', metadataPath);

    // Generate fake IPFS CID
    // In production, this would be a real IPFS CID from pinning the content
    // For demo purposes, we create a deterministic fake CID based on timestamp
    const fakeCid = `Qm${timestamp.toString(36).padStart(44, 'X').toUpperCase()}`;

    console.log('[IPFS Mock] Generated fake CID:', fakeCid);

    return Response.json(
      {
        success: true,
        cid: fakeCid,
      } as UploadResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[IPFS Mock] Error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      } as UploadResponse,
      { status: 500 }
    );
  }
}
