import {HostBase} from "./hosts-base";
import * as ts from 'typescript';
import {CodeTransformer} from "./transformer";
import {ChainableHost} from "./hosts-base";
import {MutableSourceCode} from "./mutable-source-code";
import RawSourceMap = SourceMap.RawSourceMap;



export class TransformationHost extends ChainableHost {
	private transformations: { [fileName: string]: MutableSourceCode } = {};

	constructor(private transformer: CodeTransformer) {
		super();
	}

	getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
		const ast: ts.SourceFile = super.getSourceFile(fileName, languageVersion, onError);
		if(ast) {
			const transformation = this.transformer.transform(ast);
			this.transformations[ast.fileName] = transformation;
			return transformation.ast;
		} else {
			return null;
		}
	}

	getSourceMap(fileName: string): RawSourceMap {
		const transformation: MutableSourceCode = this.transformations[fileName];
		if(transformation) {
			return transformation.sourceMap;
		} else {
			return null;
		}
	}

	translateDiagnostic(diagnostic: ts.Diagnostic): ts.Diagnostic {
		const transformation = this.transformations[diagnostic.file.fileName];
		return transformation ? transformation.translateDiagnostic(diagnostic) : diagnostic;
	}
}

export class SemanticHost extends ChainableHost implements ts.LanguageServiceHost, ts.CompilerHost, ts.DocumentRegistry {
	constructor(
		private files: string[],
		private compilerOptions: ts.CompilerOptions
	) {
		super();
	}

	getProjectVersion():string {
		return null;
	}

	getScriptFileNames():string[]{
		return this.files.slice();
	}

	getScriptVersion(fileName:string):string{
		return null;
	}

	getScriptSnapshot(fileName:string):ts.IScriptSnapshot{
		return ts.ScriptSnapshot.fromString(this.readFile(fileName));
	}

	getLocalizedDiagnosticMessages():any{
		return null;
	}

	getCompilationSettings():ts.CompilerOptions{
		return this.compilerOptions;
	}



	log(s:string):void {
	}

	trace(s:string):void {
	}

	error(s:string):void {
	}

	resolveModuleNames(moduleNames:string[], containingFile:string):ts.ResolvedModule[]{
		return moduleNames.map((moduleName: string) => ({
			resolvedFileName: moduleName.replace(/^[.][/]/g, ''),
			isExternalLibraryImport: false
		}));
	}

	directoryExists(directoryName:string):boolean{
		return null;
	}

	acquireDocument(fileName: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: ts.IScriptSnapshot, version: string): ts.SourceFile {
		return this.source.getSourceFile(fileName, compilationSettings.target);
	}
	/**
	 * Request an updated version of an already existing SourceFile with a given fileName
	 * and compilationSettings. The update will in-turn call updateLanguageServiceSourceFile
	 * to get an updated SourceFile.
	 *
	 * @param fileName The name of the file requested
	 * @param compilationSettings Some compilation settings like target affects the
	 * shape of a the resulting SourceFile. This allows the DocumentRegistry to store
	 * multiple copies of the same file for different compilation settings.
	 * @param scriptSnapshot Text of the file.
	 * @param version Current version of the file.
	 */
	updateDocument(fileName: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: ts.IScriptSnapshot, version: string): ts.SourceFile {
		return this.source.getSourceFile(fileName, compilationSettings.target);
	}
	/**
	 * Informs the DocumentRegistry that a file is not needed any longer.
	 *
	 * Note: It is not allowed to call release on a SourceFile that was not acquired from
	 * this registry originally.
	 *
	 * @param fileName The name of the file to be released
	 * @param compilationSettings The compilation settings used to acquire the file
	 */
	releaseDocument(fileName: string, compilationSettings: ts.CompilerOptions): void {

	}
	reportStats(): string {
		return '';
	}
}

