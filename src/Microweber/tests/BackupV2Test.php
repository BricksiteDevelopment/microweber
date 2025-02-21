<?php
namespace Microweber\tests;

use Microweber\Utils\Backup\BackupManager;
use Faker\Factory;
use Microweber\Utils\Backup\EncodingFix;

/**
 * Run test
 * @author Bobi Microweber
 * @command php phpunit.phar --filter BackupV2Test
 */

class BackupV2Test extends TestCase
{
	private static $_titles = array();
	private static $_exportedFile = '';
	
	public function testEncoding() {
		
		$locales = array('el_GR', 'bg_BG', 'en_EN','at_AT','ko_KR','kk_KZ','ja_JP','fi_FI','es_ES');
		
		foreach($locales as $locale) {
			
			$faker = Factory::create($locale);
			
			$inputTitle = $faker->name;
			
			if (empty($inputTitle)) {
				$this->assertTrue(false);
			} else {
				$this->assertTrue(true);
				
				$contentId=  save_content(array("title"=>$inputTitle));
				$outputContent = get_content("single=true&id=" . $contentId);
				
				$this->assertSame($outputContent['title'], $inputTitle);
				
				self::$_titles[] = array("id"=>$contentId, "title"=>$inputTitle, "url"=>$outputContent['full_url']);
			} 
		}
		
		
	}
	
	public function testFullExport() {
		
		clearcache();
		
		$manager = new BackupManager();
		$manager->setExportAllData(true);
		
		$i = 0;
		while (true) {
			
			$export = $manager->startExport();
			
			$exportBool = false;
			if (!empty($export)) {
				$exportBool = true;
			}
			
			$this->assertTrue($exportBool);
			
			if (isset($export['current_step'])) {
				$this->assertArrayHasKey('current_step', $export);
				$this->assertArrayHasKey('total_steps', $export);
				$this->assertArrayHasKey('precentage', $export);
				$this->assertArrayHasKey('data', $export);
			}
			
			// The last exort step
			if (isset($export['success'])) {
				$this->assertArrayHasKey('data', $export);
				$this->assertArrayHasKey('download', $export['data']);
				$this->assertArrayHasKey('filepath', $export['data']);
				$this->assertArrayHasKey('filename', $export['data']);
				
				self::$_exportedFile = $export['data']['filepath'];
				
				break;
			}
			
			if ($i > 100) { 
				break;
			}
			
			$i++;
		}
		
	}
	
	public function testImportZipFile() {
		
		foreach(get_content('no_limit=1&content_type=post') as $content) {
			//echo 'Delete content..' . PHP_EOL;
			$this->assertArrayHasKey(0, delete_content(array('id'=>$content['id'], 'forever'=>true)));
		}
		
		if (empty(self::$_exportedFile)) {
			$this->assertTrue(false);
			return;
		}
		
		$manager = new BackupManager();
		$manager->setImportFile(self::$_exportedFile);
		$manager->setImportBatch(false);
		
		$import = $manager->startImport();
		
		
		$importBool = false;
		if (!empty($import)) {
			$importBool = true;
		}
		
		$this->assertTrue($importBool);
		
		$this->assertArrayHasKey('done', $import);
		$this->assertArrayHasKey('precentage', $import);
	}
	
	public function testImportedEncoding() {
		
		$urls = array();
		foreach (self::$_titles as $title) {
			$urls[$title['url']] = $title;
		}

		$contents = get_content('no_limit=1&content_type=post');
		
		if (empty($contents)) {
			$this->assertTrue(false);
			return;
		}
		
		foreach($contents as $content) {
			if (array_key_exists($content['url'], $urls)) {
				$this->assertSame($urls[$content['url']]['title'], $content['title']);
			}
		}
	}
	
	public function testImportWrongFile() {
		
		$manager = new BackupManager();
		$manager->setImportFile('wrongfile.txt');
		$manager->setImportBatch(false);
		
		$importStatus = $manager->startImport();
		
		$this->assertArrayHasKey('error', $importStatus);
	}
	
	public function testExportWithWrongFormat()
	{
		$export = new BackupManager();
		$export->setExportType('xml_');
		$exportStatus = $export->startExport();
		
		$this->assertArrayHasKey('error', $exportStatus);
	}
	
}